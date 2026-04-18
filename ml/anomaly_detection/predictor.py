"""
FleetPulse Anomaly Predictor
Used by Lambda functions and backend to detect anomalies in GPS payloads.
"""
import os
import pickle
import numpy as np
from ml.anomaly_detection.thresholds import (
    SPEED_LIMIT_KMPH,
    FUEL_DROP_THRESHOLD_PCT,
    ROUTE_DEVIATION_KM,
    SEVERITY,
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
_model_cache = None


def load_model():
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    with open(MODEL_PATH, 'rb') as f:
        _model_cache = pickle.load(f)
    return _model_cache


def predict(payload: dict) -> tuple[bool, float]:
    """
    Run Isolation Forest prediction on a GPS payload.
    Returns (is_anomaly: bool, score: float)
    Score < 0 = anomaly, Score > 0 = normal
    """
    artifact = load_model()
    model = artifact['model']
    features = artifact['features']

    fv = np.array([[
        float(payload.get('speed', 0)),
        float(payload.get('fuel_level', 100)),
        float(payload.get('fuel_drop', 0)),
        float(payload.get('latitude', 11.03)),
        float(payload.get('longitude', 76.96)),
        float(payload.get('route_deviation_km', 0)),
    ]])

    prediction = model.predict(fv)
    score = model.decision_function(fv)
    return prediction[0] == -1, float(score[0])


def detect_anomaly_types(payload: dict, previous_fuel: float = None) -> list:
    """
    Detect specific anomaly types from GPS payload.
    Returns list of anomaly dicts with type, severity, details.
    """
    anomalies = []
    speed = float(payload.get('speed', 0))
    fuel = float(payload.get('fuel_level', 100))
    lat = float(payload.get('latitude', 11.03))
    lon = float(payload.get('longitude', 76.96))

    # Overspeeding
    if speed > SPEED_LIMIT_KMPH:
        anomalies.append({
            'type': 'OVERSPEEDING',
            'severity': SEVERITY['OVERSPEEDING'],
            'details': f'Speed {speed} km/h exceeds {SPEED_LIMIT_KMPH} km/h limit',
        })

    # Fuel theft
    if previous_fuel is not None:
        drop = previous_fuel - fuel
        if drop > FUEL_DROP_THRESHOLD_PCT:
            anomalies.append({
                'type': 'FUEL_THEFT',
                'severity': SEVERITY['FUEL_THEFT'],
                'details': f'Fuel dropped {drop:.1f}% suddenly (from {previous_fuel}% to {fuel}%)',
            })

    # Route deviation (outside Coimbatore bounds)
    if lat < 10.95 or lat > 11.15 or lon < 76.85 or lon > 77.10:
        anomalies.append({
            'type': 'ROUTE_DEVIATION',
            'severity': SEVERITY['ROUTE_DEVIATION'],
            'details': f'Vehicle outside expected area: lat={lat}, lon={lon}',
        })

    return anomalies


def analyze(payload: dict, previous_fuel: float = None) -> dict:
    """
    Full analysis — combines ML prediction + rule-based detection.
    Returns complete anomaly report.
    """
    is_anomaly, score = predict(payload)
    anomaly_types = detect_anomaly_types(payload, previous_fuel)

    return {
        'vehicle_id': payload.get('vehicle_id'),
        'is_anomaly': is_anomaly or len(anomaly_types) > 0,
        'ml_score': score,
        'anomaly_types': anomaly_types,
        'payload': payload,
    }