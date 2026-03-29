# backend/tests/conftest.py
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
    token = create_access_token("test-user")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_dynamodb():
    with patch("app.db.dynamodb.get_dynamodb_resource") as mock:
        mock_resource = MagicMock()
        mock.return_value = mock_resource
        yield mock_resource


@pytest.fixture
def mock_redis():
    with patch("app.dependencies.aioredis.from_url") as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        yield mock_client
