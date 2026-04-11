import boto3
from datetime import datetime

dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
vehicles_table = dynamodb.Table("Vehicles")
trips_table = dynamodb.Table("Trips")


def write_trip_record(payload: dict):
    """Write GPS ping as trip record to DynamoDB"""
    trip_record = {
        "trip_id": f"{payload['vehicle_id']}-{payload['timestamp']}",
        "vehicle_id": payload["vehicle_id"],
        "driver_id": payload["driver_id"],
        "latitude": str(payload["latitude"]),
        "longitude": str(payload["longitude"]),
        "speed": str(payload["speed"]),
        "fuel_level": str(payload["fuel_level"]),
        "timestamp": payload["timestamp"],
        "status": payload["status"],
        "created_at": datetime.utcnow().isoformat(),
    }
    trips_table.put_item(Item=trip_record)
    print(f"✅ Trip written: {trip_record['trip_id']}")


def update_vehicle_location(payload: dict):
    """Update vehicle's current location in DynamoDB"""
    vehicles_table.update_item(
        Key={"vehicle_id": payload["vehicle_id"]},
        UpdateExpression=(
            "SET latitude = :lat, longitude = :lon, "
            "speed = :speed, fuel_level = :fuel, "
            "last_updated = :ts, #st = :status"
        ),
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues={
            ":lat": str(payload["latitude"]),
            ":lon": str(payload["longitude"]),
            ":speed": str(payload["speed"]),
            ":fuel": str(payload["fuel_level"]),
            ":ts": payload["timestamp"],
            ":status": payload["status"],
        },
    )
    print(f"📍 Vehicle updated: {payload['vehicle_id']}")
