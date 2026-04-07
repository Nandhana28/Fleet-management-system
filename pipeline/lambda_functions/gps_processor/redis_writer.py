import json
import redis

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
CACHE_TTL = 300  # 5 minutes


def write_location_cache(payload: dict):
    """Write vehicle location to Redis cache"""
    try:
        key = f"vehicle:location:{payload['vehicle_id']}"
        redis_client.setex(key, CACHE_TTL, json.dumps(payload))
        print(f"✅ Redis updated: {key}")
    except Exception as e:
        print(f"⚠️ Redis unavailable: {str(e)}")
