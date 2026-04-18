import json
import os
import redis

CACHE_TTL = 300  # 5 minutes


def _get_redis():
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    return redis.from_url(redis_url, decode_responses=True)


def write_location_cache(payload: dict):
    """Write vehicle location to Redis cache."""
    try:
        r = _get_redis()
        key = f"vehicle:{payload['vehicle_id']}:location"
        data = {
            'latitude': payload.get('latitude'),
            'longitude': payload.get('longitude'),
            'speed': payload.get('speed'),
            'fuel_level': payload.get('fuel_level'),
            'status': payload.get('status', 'moving'),
            'timestamp': payload.get('timestamp'),
            'source': payload.get('source', ''),
            'dest': payload.get('dest', ''),
            'progress': payload.get('progress', 0),
        }
        r.setex(key, CACHE_TTL, json.dumps(data))
        print(f"[Redis] Location cached: {key}")
    except Exception as e:
        print(f"[Redis] Unavailable: {e}")