import pytest
import sys
import os
from unittest.mock import patch, MagicMock


# ─── Health ───────────────────────────────────────────────────────────────────

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ─── Auth ─────────────────────────────────────────────────────────────────────

def test_no_auth_returns_403(client):
    for endpoint in ["/vehicles", "/alerts", "/settings"]:
        res = client.get(endpoint)
        assert res.status_code in (401, 403)


def test_invalid_token(client):
    res = client.get("/vehicles", headers={"Authorization": "Bearer bad-token"})
    assert res.status_code == 401


# ─── Vehicles ─────────────────────────────────────────────────────────────────

def test_list_vehicles_no_auth(client):
    response = client.get("/vehicles")
    assert response.status_code == 403


def test_list_vehicles_with_auth(client, auth_headers, sample_vehicle):
    with patch("app.db.queries.get_all_vehicles", return_value=[sample_vehicle]), \
         patch("app.services.cache_service.get_all_vehicle_locations", return_value={}):
        response = client.get("/vehicles", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["vehicle_id"] == "vehicle-1"


def test_get_vehicle_not_found(client, auth_headers):
    with patch("app.db.queries.get_vehicle_by_id", return_value=None):
        response = client.get("/vehicles/vehicle-99", headers=auth_headers)
        assert response.status_code == 404


def test_get_vehicle_found(client, auth_headers, sample_vehicle):
    with patch("app.db.queries.get_vehicle_by_id", return_value=sample_vehicle), \
         patch("app.services.cache_service.get_vehicle_location", return_value=None):
        response = client.get("/vehicles/vehicle-1", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["vehicle_id"] == "vehicle-1"


def test_get_vehicle_trips(client, auth_headers, sample_vehicle):
    trips = [{"trip_id": "trip-1", "vehicle_id": "vehicle-1", "timestamp": "2026-04-12T09:00:00"}]
    with patch("app.db.queries.get_vehicle_by_id", return_value=sample_vehicle), \
         patch("app.db.queries.get_trips_for_vehicle", return_value=trips):
        response = client.get("/vehicles/vehicle-1/trips", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1


# ─── Alerts ───────────────────────────────────────────────────────────────────

def test_list_alerts_no_auth(client):
    response = client.get("/alerts")
    assert response.status_code == 403


def test_list_alerts(client, auth_headers, sample_alert):
    with patch("app.services.alert_service.get_active_alerts", return_value=[sample_alert]):
        response = client.get("/alerts?active_only=true", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()[0]["alert_type"] == "OVERSPEEDING"


def test_resolve_alert(client, auth_headers, sample_alert):
    resolved = {**sample_alert, "resolved": True}
    with patch("app.services.alert_service.resolve_alert", return_value=resolved):
        response = client.patch("/alerts/alert-123/resolve", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["resolved"] is True


def test_resolve_alert_not_found(client, auth_headers):
    with patch("app.services.alert_service.resolve_alert", return_value=None):
        response = client.patch("/alerts/nonexistent/resolve", headers=auth_headers)
        assert response.status_code == 404


# ─── Analytics ────────────────────────────────────────────────────────────────

def test_fuel_analytics(client, auth_headers):
    with patch("app.services.analytics_service.get_fuel_analytics", return_value=[]):
        response = client.get("/analytics/fuel", headers=auth_headers)
        assert response.status_code == 200


def test_driver_analytics(client, auth_headers):
    with patch("app.services.analytics_service.get_driver_analytics", return_value=[]):
        response = client.get("/analytics/drivers", headers=auth_headers)
        assert response.status_code == 200


def test_trip_analytics(client, auth_headers):
    with patch("app.services.analytics_service.get_trip_analytics", return_value=[]):
        response = client.get("/analytics/trips", headers=auth_headers)
        assert response.status_code == 200


# ─── Auth endpoints ───────────────────────────────────────────────────────────

def test_register_missing_fields(client):
    response = client.post("/auth/register", json={"email": "test@test.com"})
    assert response.status_code == 422


def test_login_wrong_password(client):
    with patch("app.services.auth_service.login_user",
               side_effect=ValueError("Invalid email or password.")):
        response = client.post("/auth/login",
                               json={"email": "test@test.com", "password": "wrong"})
        assert response.status_code == 401


def test_login_success(client):
    with patch("app.services.auth_service.login_user", return_value="mock-jwt-token"):
        response = client.post("/auth/login",
                               json={"email": "test@test.com", "password": "correct"})
        assert response.status_code == 200
        assert "token" in response.json()


def test_forgot_password(client):
    with patch("app.services.auth_service.generate_reset_token",
               return_value="reset-token"):
        response = client.post("/auth/forgot-password",
                               json={"email": "test@test.com"})
        assert response.status_code == 200


# ─── ML Tests ────────────────────────────────────────────────────────────────

def test_ml_overspeed():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    sys.path.insert(0, root)
    try:
        from ml.anomaly_detection.predictor import analyze
        result = analyze({"vehicle_id": "v1", "speed": 110, "fuel_level": 85,
                          "fuel_drop": 0.5, "latitude": 11.023,
                          "longitude": 76.987, "route_deviation_km": 0.3})
        assert result["is_anomaly"] == True
        assert any(a["type"] == "OVERSPEEDING" for a in result["anomaly_types"])
    except ImportError:
        pytest.skip("ML model not available")


def test_ml_normal():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    sys.path.insert(0, root)
    try:
        from ml.anomaly_detection.predictor import analyze
        result = analyze({"vehicle_id": "v2", "speed": 35, "fuel_level": 70,
                          "fuel_drop": 0.3, "latitude": 11.03,
                          "longitude": 76.96, "route_deviation_km": 0.2})
        assert result["is_anomaly"] == False
    except ImportError:
        pytest.skip("ML model not available")


def test_ml_fuel_theft():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    sys.path.insert(0, root)
    try:
        from ml.anomaly_detection.predictor import analyze
        result = analyze({"vehicle_id": "v3", "speed": 35, "fuel_level": 50,
                          "fuel_drop": 0.3, "latitude": 11.03,
                          "longitude": 76.96, "route_deviation_km": 0.1},
                         previous_fuel=80)
        assert result["is_anomaly"] == True
        assert any(a["type"] == "FUEL_THEFT" for a in result["anomaly_types"])
    except ImportError:
        pytest.skip("ML model not available")