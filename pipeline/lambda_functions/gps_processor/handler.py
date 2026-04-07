import json
from dynamodb_writer import write_trip_record, update_vehicle_location
from redis_writer import write_location_cache


def handler(event, context):
    """
    Main GPS Processor Lambda
    SQS → DynamoDB Trips + Vehicles + Redis Cache
    """
    print(f"📦 Processing {len(event['Records'])} GPS records")
    success = 0
    errors = 0

    for record in event["Records"]:
        try:
            payload = json.loads(record["body"])
            write_trip_record(payload)
            update_vehicle_location(payload)
            write_location_cache(payload)
            success += 1
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            errors += 1

    print(f"✅ Done! Success: {success}, Errors: {errors}")
    return {
        "statusCode": 200,
        "body": json.dumps({"success": success, "errors": errors}),
    }
