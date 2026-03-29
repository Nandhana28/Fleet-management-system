# backend/tests/test_vehicles.py
from unittest.mock import patch


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_vehicles_no_auth(client):
    response = client.get("/vehicles")
    assert response.status_code == 403


def test_list_vehicles_with_auth(client, auth_headers):
    with patch("app.db.queries.get_all_vehicles", return_value=[
        {"vehicle_id": "vehicle-1", "status": "moving"}
    ]):
        response = client.get("/vehicles", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1


def test_get_vehicle_not_found(client, auth_headers):
    with patch("app.db.queries.get_vehicle_by_id", return_value=None):
        response = client.get("/vehicles/vehicle-99", headers=auth_headers)
        assert response.status_code == 404
