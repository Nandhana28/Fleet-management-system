import json


def decode_gps_record(message: dict) -> dict:
    """Parse SQS message body into clean GPS record"""
    try:
        payload = json.loads(message["Body"])
        return {
            "vehicle_id": payload["vehicle_id"],
            "driver_id": payload["driver_id"],
            "latitude": float(payload["latitude"]),
            "longitude": float(payload["longitude"]),
            "speed": float(payload["speed"]),
            "fuel_level": float(payload["fuel_level"]),
            "timestamp": payload["timestamp"],
            "status": payload.get("status", "moving"),
        }
    except Exception as e:
        print(f"❌ Decode error: {str(e)}")
        return None
