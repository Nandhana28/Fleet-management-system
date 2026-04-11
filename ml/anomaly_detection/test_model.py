import os
import sys

sys.path.insert(0, os.path.abspath("."))  # noqa: E402

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from ml.anomaly_detection.model import (  # noqa: E402
    detect_anomaly_type,
    generate_training_data,
    predict_anomaly,
    train_model,
)


# ─── Fixtures ────────────────────────────────────────────────────────────────


@pytest.fixture
def trained_model():
    """Train a small model for testing"""
    df = generate_training_data(n_samples=500)
    model, features = train_model(df)
    return model, features


# ─── Test 1: Training Data ────────────────────────────────────────────────────


def test_training_data_generation():
    """Test that training data is generated correctly"""
    df = generate_training_data(n_samples=100)
    assert len(df) == 100
    assert "speed" in df.columns
    assert "fuel_level" in df.columns
    assert "latitude" in df.columns
    print("✅ Training data generation test passed!")


def test_training_data_ranges():
    """Test that training data values are within expected ranges"""
    df = generate_training_data(n_samples=500)
    assert df["speed"].min() >= 20
    assert df["speed"].max() <= 60
    assert df["fuel_level"].min() >= 30
    assert df["fuel_level"].max() <= 100
    print("✅ Training data ranges test passed!")


# ─── Test 2: Overspeeding ─────────────────────────────────────────────────────


def test_overspeeding_detection():
    """Test that overspeeding is correctly detected"""
    payload = {
        "vehicle_id": "vehicle-1",
        "speed": 110,
        "fuel_level": 85,
        "latitude": 11.023,
        "longitude": 76.987,
        "route_deviation_km": 0.3,
    }
    anomalies = detect_anomaly_type(payload)
    anomaly_types = [a["type"] for a in anomalies]
    assert "OVERSPEEDING" in anomaly_types
    print(f"✅ Overspeeding detection passed! {anomaly_types}")


def test_no_overspeeding_normal_speed():
    """Test that normal speed does not trigger alert"""
    payload = {
        "vehicle_id": "vehicle-2",
        "speed": 45,
        "fuel_level": 85,
        "latitude": 11.023,
        "longitude": 76.987,
        "route_deviation_km": 0.3,
    }
    anomalies = detect_anomaly_type(payload)
    anomaly_types = [a["type"] for a in anomalies]
    assert "OVERSPEEDING" not in anomaly_types
    print("✅ No overspeeding for normal speed passed!")


# ─── Test 3: Fuel Theft ───────────────────────────────────────────────────────


def test_fuel_theft_detection():
    """Test that sudden fuel drop is detected"""
    payload = {
        "vehicle_id": "vehicle-3",
        "speed": 35,
        "fuel_level": 50,
        "latitude": 11.045,
        "longitude": 76.955,
        "route_deviation_km": 0.1,
    }
    anomalies = detect_anomaly_type(payload, previous_fuel=80)
    anomaly_types = [a["type"] for a in anomalies]
    assert "FUEL_THEFT" in anomaly_types
    print(f"✅ Fuel theft detection passed! {anomaly_types}")


def test_no_fuel_theft_normal_drop():
    """Test that normal fuel consumption is not flagged"""
    payload = {
        "vehicle_id": "vehicle-4",
        "speed": 40,
        "fuel_level": 79,
        "latitude": 11.045,
        "longitude": 76.955,
        "route_deviation_km": 0.1,
    }
    anomalies = detect_anomaly_type(payload, previous_fuel=80)
    anomaly_types = [a["type"] for a in anomalies]
    assert "FUEL_THEFT" not in anomaly_types
    print("✅ No fuel theft for normal consumption passed!")


# ─── Test 4: Route Deviation ──────────────────────────────────────────────────


def test_route_deviation_detection():
    """Test that vehicle outside Coimbatore is flagged"""
    payload = {
        "vehicle_id": "vehicle-5",
        "speed": 40,
        "fuel_level": 70,
        "latitude": 12.5,
        "longitude": 76.96,
        "route_deviation_km": 5,
    }
    anomalies = detect_anomaly_type(payload)
    anomaly_types = [a["type"] for a in anomalies]
    assert "ROUTE_DEVIATION" in anomaly_types
    print(f"✅ Route deviation detection passed! {anomaly_types}")


def test_no_route_deviation_in_coimbatore():
    """Test that vehicle inside Coimbatore is not flagged"""
    payload = {
        "vehicle_id": "vehicle-6",
        "speed": 40,
        "fuel_level": 70,
        "latitude": 11.023,
        "longitude": 76.987,
        "route_deviation_km": 0.3,
    }
    anomalies = detect_anomaly_type(payload)
    anomaly_types = [a["type"] for a in anomalies]
    assert "ROUTE_DEVIATION" not in anomaly_types
    print("✅ No route deviation inside Coimbatore passed!")


# ─── Test 5: Model Prediction ─────────────────────────────────────────────────


def test_model_prediction_returns_bool(trained_model):
    """Test that model prediction returns boolean and score"""
    model, features = trained_model
    payload = {
        "speed": 45,
        "fuel_level": 80,
        "fuel_drop": 0.5,
        "latitude": 11.023,
        "longitude": 76.987,
        "route_deviation_km": 0.3,
    }
    is_anomaly, score = predict_anomaly(model, features, payload)
    assert isinstance(is_anomaly, (bool, np.bool_))
    assert isinstance(score, float)
    print(f"✅ Model prediction passed! anomaly={is_anomaly}, score={score:.3f}")
