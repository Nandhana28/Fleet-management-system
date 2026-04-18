# backend/app/services/alert_service.py
import os
import sys
import json
import redis
from datetime import datetime
from app.db import queries
from app.services.cache_service import set_active_alert_count

# Add ML module to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

try:
    from ml.anomaly_detection.predictor import analyze as analyze_anomaly
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("[Alert Service] ML module not available - anomaly detection disabled")


def _get_redis():
    """Get Redis client for caching previous fuel levels."""
    try:
        redis_url = os.environ.get("REDIS_URL", "redis://127.0.0.1:6380/0")
        client = redis.from_url(redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


def analyze_gps_payload(vehicle_id: str, payload: dict) -> dict | None:
    """
    Analyze GPS payload for anomalies using ML model.
    Returns alert dict if anomaly detected, None otherwise.
    """
    if not ML_AVAILABLE:
        return None
    
    try:
        # Get previous fuel level for fuel theft detection
        redis_client = _get_redis()
        previous_fuel = None
        if redis_client:
            prev_data = redis_client.get(f"vehicle:{vehicle_id}:prev_fuel")
            if prev_data:
                previous_fuel = float(prev_data)
        
        # Run anomaly analysis
        analysis = analyze_anomaly(payload, previous_fuel)
        
        # Cache current fuel for next comparison
        if redis_client and payload.get('fuel_level'):
            redis_client.set(f"vehicle:{vehicle_id}:prev_fuel", payload['fuel_level'], ex=3600)
        
        # If anomalies detected, create alert
        if analysis.get('is_anomaly') and analysis.get('anomaly_types'):
            import uuid
            alert = {
                'alert_id': str(uuid.uuid4()),
                'vehicle_id': vehicle_id,
                'alert_type': analysis['anomaly_types'][0]['type'],
                'severity': analysis['anomaly_types'][0]['severity'],
                'resolved': False,
                'timestamp': datetime.utcnow().isoformat(),
                'message': analysis['anomaly_types'][0]['details'],
                'latitude': str(payload.get('latitude', '')),
                'longitude': str(payload.get('longitude', '')),
                'ml_score': analysis['ml_score'],
                'anomaly_details': json.dumps(analysis['anomaly_types']),
            }
            return alert
    except Exception as e:
        print(f"[Alert Service] Anomaly analysis failed: {e}")
    
    return None


def create_alert_from_anomaly(alert_data: dict) -> dict | None:
    """Create and store alert in DynamoDB."""
    try:
        return queries.create_alert(alert_data)
    except Exception as e:
        print(f"[Alert Service] Failed to create alert: {e}")
        return None


def get_active_alerts() -> list:
    alerts = queries.get_all_alerts(active_only=True)
    set_active_alert_count(len(alerts))
    return alerts


def get_all_alerts() -> list:
    return queries.get_all_alerts(active_only=False)


def resolve_alert(alert_id: str) -> dict | None:
    alert = queries.get_alert_by_id(alert_id)
    if not alert:
        return None
    updated = queries.resolve_alert(alert_id)
    # refresh alert count in Redis
    active = queries.get_all_alerts(active_only=True)
    set_active_alert_count(len(active))
    return updated