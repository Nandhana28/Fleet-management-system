import json
import os

# import boto3
import redis

# Redis connection — local Redis in dev, ElastiCache in prod
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_TTL = 300  # Cache expires after 5 minutes

# Connect to Redis
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


def update_vehicle_location_cache(payload):
    """
    Store latest vehicle location in Redis for fast API reads
    Key format: vehicle:location:{vehicle_id}
    """
    cache_key = f"vehicle:location:{payload['vehicle_id']}"

    cache_data = {
        "vehicle_id": payload["vehicle_id"],
        "driver_id": payload["driver_id"],
        "latitude": str(payload["latitude"]),
        "longitude": str(payload["longitude"]),
        "speed": str(payload["speed"]),
        "fuel_level": str(payload["fuel_level"]),
        "status": payload["status"],
        "timestamp": payload["timestamp"],
    }

    # Store in Redis with TTL
    redis_client.setex(name=cache_key, time=REDIS_TTL, value=json.dumps(cache_data))
    print(f"✅ Redis updated: {cache_key}")


def get_vehicle_location_cache(vehicle_id):
    """
    Get latest vehicle location from Redis cache
    Used by FastAPI for sub-100ms map refresh
    """
    cache_key = f"vehicle:location:{vehicle_id}"
    cached = redis_client.get(cache_key)

    if cached:
        print(f"✅ Cache hit: {cache_key}")
        return json.loads(cached)

    print(f"❌ Cache miss: {cache_key}")
    return None


def get_all_vehicles_cache():
    """Get all vehicle locations from Redis at once"""
    keys = redis_client.keys("vehicle:location:*")
    vehicles = []

    for key in keys:
        cached = redis_client.get(key)
        if cached:
            vehicles.append(json.loads(cached))

    print(f"✅ Retrieved {len(vehicles)} vehicles from cache")
    return vehicles


def handler(event, context):
    """
    Redis Updater Lambda
    Updates Redis cache with latest vehicle locations
    Triggered alongside kinesis_consumer
    """
    print(f"📦 Updating Redis for {len(event['Records'])} records")

    success_count = 0
    error_count = 0

    for record in event["Records"]:
        try:
            import base64

            raw_data = base64.b64decode(record["kinesis"]["data"]).decode("utf-8")
            payload = json.loads(raw_data)

            # Update Redis cache
            update_vehicle_location_cache(payload)
            success_count += 1

        except Exception as e:
            print(f"❌ Error updating Redis: {str(e)}")
            error_count += 1

    print(f"✅ Done! Success: {success_count}, Errors: {error_count}")
    return {
        "statusCode": 200,
        "body": json.dumps({"success": success_count, "errors": error_count}),
    }
