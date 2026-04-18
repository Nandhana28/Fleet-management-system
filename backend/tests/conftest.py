import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.middleware.auth import create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token("test-user-id")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_vehicle():
    return {
        "vehicle_id": "vehicle-1",
        "registration": "TN 33 AB 1234",
        "driver_id": "driver-1",
        "type": "lorry",
        "fuel_capacity": 200,
        "status": "moving",
        "current_location": None,
    }


@pytest.fixture
def sample_alert():
    return {
        "alert_id": "alert-123",
        "vehicle_id": "vehicle-1",
        "alert_type": "OVERSPEEDING",
        "severity": "HIGH",
        "message": "Speed 110 km/h exceeds limit",
        "status": "UNRESOLVED",
        "resolved": False,
        "timestamp": "2026-04-12T10:00:00",
    }


@pytest.fixture
def sample_driver():
    return {
        "driver_id": "driver-1",
        "name": "Rajesh Kumar",
        "safety_score": 85,
        "total_trips": 42,
    }

@pytest.fixture(autouse=True)
def mock_redis_client():
    """Auto-mock Redis for all tests — no real Redis needed."""
    mock = MagicMock()
    mock.get.return_value = None
    mock.keys.return_value = []
    mock.setex.return_value = True
    with patch("app.services.cache_service.client", mock):
        yield mock