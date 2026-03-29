import json
import boto3
import base64
from datetime import datetime

# AWS clients
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
vehicles_table = dynamodb.Table("Vehicles")
trips_table = dynamodb.Table("Trips")


def parse_gps_payload(record):
    """Decode and parse a single Kinesis record"""
    # Kinesis records are base64 encoded
    raw_data = base64.b64decode(record["kinesis"]["data"]).decode("utf-8")
    return json.loads(raw_data)


def save_trip_record(payload):
    """Save enriched trip record to DynamoDB Trips table"""
    trip_record = {
        "trip_id": f"{payload['vehicle_id']}-{payload['timestamp']}",
        "timestamp": payload["timestamp"],
        "vehicle_id": payload["vehicle_id"],
        "driver_id": payload["driver_id"],
        "latitude": str(payload["latitude"]),
        "longitude": str(payload["longitude"]),
        "speed": str(payload["speed"]),
        "fuel_level": str(payload["fuel_level"]),
        "status": payload["status"],
        "created_at": datetime.utcnow().isoformat(),
    }
    trips_table.put_item(Item=trip_record)
    print(f"✅ Trip saved: {trip_record['trip_id']}")


def update_vehicle_location(payload):
    """Update DynamoDB Vehicles table with latest GPS location"""
    vehicles_table.update_item(
        Key={"vehicle_id": payload["vehicle_id"]},
        UpdateExpression="""
            SET latitude = :lat,
                longitude = :lon,
                speed = :speed,
                fuel_level = :fuel,
                last_updated = :ts,
                #st = :status
        """,
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


def handler(event, context):
    """
    Main Lambda handler — triggered by Kinesis stream
    Processes batches of GPS records
    """
    print(f"📦 Processing {len(event['Records'])} records from Kinesis")

    success_count = 0
    error_count = 0

    for record in event["Records"]:
        try:
            # Parse GPS payload from Kinesis record
            payload = parse_gps_payload(record)
            print(f"🚗 Processing {payload['vehicle_id']} at {payload['timestamp']}")

            # Save to Trips table
            save_trip_record(payload)

            # Update Vehicles table with latest location
            update_vehicle_location(payload)

            success_count += 1

        except Exception as e:
            print(f"❌ Error processing record: {str(e)}")
            error_count += 1

    print(f"✅ Done! Success: {success_count}, Errors: {error_count}")
    return {
        "statusCode": 200,
        "body": json.dumps({"success": success_count, "errors": error_count}),
    }
