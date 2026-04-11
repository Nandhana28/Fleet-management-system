import boto3
from datetime import datetime

# AWS clients
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
sns_client = boto3.client("sns", region_name="ap-south-1")
sqs_client = boto3.client("sqs", region_name="ap-south-1")

# DynamoDB tables
vehicles_table = dynamodb.Table("Vehicles")
trips_table = dynamodb.Table("Trips")
alerts_table = dynamodb.Table("Alerts")


# ─── Tool 1: Query Vehicle Location ──────────────────────────────────────────
def query_vehicle_location(vehicle_id: str) -> dict:
    """
    Query the latest location of a vehicle from DynamoDB
    Returns: lat, lng, speed, fuel level
    """
    try:
        response = vehicles_table.get_item(Key={"vehicle_id": vehicle_id})
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


# ─── Tool 2: Get Trip History ─────────────────────────────────────────────────
def get_trip_history(vehicle_id: str, days: int = 7) -> dict:
    """
    Get last N days of trips for a vehicle from DynamoDB
    Returns: list of trip records
    """
    try:
        response = trips_table.scan(
            FilterExpression="vehicle_id = :vid",
            ExpressionAttributeValues={":vid": vehicle_id},
            Limit=50,
        )
        trips = response.get("Items", [])
        return {
            "vehicle_id": vehicle_id,
            "days": days,
            "total_trips": len(trips),
            "trips": trips[:10],  # Return last 10 trips
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Tool 3: Get Active Alerts ────────────────────────────────────────────────
def get_active_alerts() -> dict:
    """
    Get all unresolved anomaly alerts from DynamoDB
    Returns: list of active alerts
    """
    try:
        response = alerts_table.scan(
            FilterExpression="#st = :status",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={":status": "UNRESOLVED"},
        )
        alerts = response.get("Items", [])
        return {
            "total_active_alerts": len(alerts),
            "alerts": alerts[:20],  # Return last 20 alerts
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Tool 4: Send WhatsApp Alert ──────────────────────────────────────────────
def send_whatsapp_alert(phone: str, message: str) -> dict:
    """
    Send WhatsApp/SMS alert via AWS SNS
    Returns: message ID if successful
    """
    try:
        response = sns_client.publish(
            PhoneNumber=phone,
            Message=f"FleetPulse Alert: {message}",
        )
        return {
            "success": True,
            "message_id": response["MessageId"],
            "phone": phone,
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Tool 5: Generate Fuel Report ────────────────────────────────────────────
def generate_fuel_report(vehicle_id: str) -> dict:
    """
    Generate fuel consumption report for a vehicle
    Aggregates DynamoDB trip data
    Returns: fuel summary
    """
    try:
        response = trips_table.scan(
            FilterExpression="vehicle_id = :vid",
            ExpressionAttributeValues={":vid": vehicle_id},
            Limit=100,
        )
        trips = response.get("Items", [])

        if not trips:
            return {"error": f"No trip data found for {vehicle_id}"}

        # Calculate fuel statistics
        fuel_levels = [
            float(t.get("fuel_level", 0)) for t in trips if t.get("fuel_level")
        ]

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


# ─── Tool 6: Update Vehicle Status ───────────────────────────────────────────
def update_vehicle_status(vehicle_id: str, status: str) -> dict:
    """
    Update vehicle status in DynamoDB
    Status can be: active, inactive, maintenance, emergency
    """
    try:
        vehicles_table.update_item(
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
