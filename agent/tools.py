import os
import json
import boto3
import redis
from datetime import datetime

def _get_boto_kwargs():
    if os.environ.get("USE_LOCALSTACK", "true").lower() == "true":
        endpoint = os.environ.get("LOCALSTACK_ENDPOINT", "http://localhost:4566")
        return {
            "endpoint_url": endpoint,
            "region_name": "ap-south-1",
            "aws_access_key_id": "test",
            "aws_secret_access_key": "test",
        }
    return {"region_name": os.environ.get("AWS_REGION", "ap-south-1")}

def _dynamodb():
    return boto3.resource("dynamodb", **_get_boto_kwargs())

def _sns():
    return boto3.client("sns", **_get_boto_kwargs())

def _redis():
    """Get Redis client for live location data."""
    try:
        redis_url = os.environ.get("REDIS_URL", "redis://127.0.0.1:6380/0")
        client = redis.from_url(redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


def query_vehicle_location(vehicle_id: str) -> dict:
    """Query live vehicle location from Redis (updated by GPS simulator)."""
    try:
        redis_client = _redis()
        if not redis_client:
            return {"error": "Redis connection failed"}
        
        # Try to get live location from Redis first
        key = f"vehicle:{vehicle_id}:location"
        data = redis_client.get(key)
        
        if data:
            location = json.loads(data)
            return {
                "vehicle_id": vehicle_id,
                "latitude": location.get("latitude"),
                "longitude": location.get("longitude"),
                "speed": location.get("speed"),
                "fuel_level": location.get("fuel_level"),
                "status": location.get("status"),
                "source": location.get("source"),
                "dest": location.get("dest"),
                "progress": location.get("progress"),
                "odometer": location.get("odometer"),
                "driver_fatigue": location.get("driver_fatigue"),
                "timestamp": location.get("timestamp"),
            }
        
        # Fallback to DynamoDB if not in Redis
        table = _dynamodb().Table("Vehicles")
        response = table.get_item(Key={"vehicle_id": vehicle_id})
        item = response.get("Item")
        if not item:
            return {"error": f"Vehicle {vehicle_id} not found"}
        return {
            "vehicle_id": vehicle_id,
            "latitude": item.get("latitude", "unknown"),
            "longitude": item.get("longitude", "unknown"),
            "speed": item.get("speed", "unknown"),
            "fuel_level": item.get("fuel_level", "unknown"),
            "status": item.get("status", "unknown"),
            "last_updated": item.get("last_updated", "unknown"),
        }
    except Exception as e:
        return {"error": str(e)}


def get_trip_history(vehicle_id: str, days: int = 7) -> dict:
    try:
        table = _dynamodb().Table("Trips")
        response = table.scan(
            FilterExpression="vehicle_id = :vid",
            ExpressionAttributeValues={":vid": vehicle_id},
            Limit=50,
        )
        trips = response.get("Items", [])
        return {
            "vehicle_id": vehicle_id,
            "days": days,
            "total_trips": len(trips),
            "trips": trips[:10],
        }
    except Exception as e:
        return {"error": str(e)}


def get_active_alerts() -> dict:
    """Get active alerts from DynamoDB."""
    try:
        table = _dynamodb().Table("Alerts")
        response = table.scan(
            FilterExpression="resolved = :resolved",
            ExpressionAttributeValues={":resolved": False},
        )
        alerts = response.get("Items", [])
        return {
            "total_active_alerts": len(alerts),
            "alerts": alerts[:20],
        }
    except Exception as e:
        return {"error": str(e)}


def send_whatsapp_alert(phone: str, message: str) -> dict:
    try:
        sns = _sns()
        response = sns.publish(
            PhoneNumber=phone,
            Message=f"FleetPulse Alert: {message}",
        )
        return {"success": True, "message_id": response["MessageId"], "phone": phone}
    except Exception as e:
        return {"error": str(e)}


def generate_fuel_report(vehicle_id: str) -> dict:
    try:
        table = _dynamodb().Table("Trips")
        response = table.scan(
            FilterExpression="vehicle_id = :vid",
            ExpressionAttributeValues={":vid": vehicle_id},
            Limit=100,
        )
        trips = response.get("Items", [])
        if not trips:
            return {"error": f"No trip data found for {vehicle_id}"}
        fuel_levels = [float(t.get("fuel_level", 0)) for t in trips if t.get("fuel_level")]
        if not fuel_levels:
            return {"error": "No fuel data available"}
        return {
            "vehicle_id": vehicle_id,
            "total_readings": len(fuel_levels),
            "average_fuel": round(sum(fuel_levels) / len(fuel_levels), 2),
            "min_fuel": round(min(fuel_levels), 2),
            "max_fuel": round(max(fuel_levels), 2),
            "report_generated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {"error": str(e)}


def update_vehicle_status(vehicle_id: str, status: str) -> dict:
    try:
        table = _dynamodb().Table("Vehicles")
        table.update_item(
            Key={"vehicle_id": vehicle_id},
            UpdateExpression="SET #st = :status, last_updated = :ts",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={
                ":status": status,
                ":ts": datetime.utcnow().isoformat(),
            },
        )
        return {
            "success": True,
            "vehicle_id": vehicle_id,
            "new_status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {"error": str(e)}