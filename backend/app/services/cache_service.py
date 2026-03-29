# backend/app/services/cache_service.py
import json
import redis
from shared.constants import (
    redis_vehicle_location,
    redis_active_alert_count,
    REDIS_TTL_VEHICLE_LOCATION,
    REDIS_TTL_ALERT_COUNT,
)
from app.config import settings

client = redis.Redis.from_url(settings.redis_url, decode_responses=True)


# ─── Vehicle Location ─────────────────────────────────────────────────────────

def set_vehicle_location(vehicle_id: str, location: dict) -> None:
    key = redis_vehicle_location(vehicle_id)
    client.setex(key, REDIS_TTL_VEHICLE_LOCATION, json.dumps(location))


def get_vehicle_location(vehicle_id: str) -> dict | None:
    key = redis_vehicle_location(vehicle_id)
    data = client.get(key)
    return json.loads(data) if data else None


def get_all_vehicle_locations() -> dict:
    """Returns {vehicle_id: location_dict} for all vehicles in Redis."""
    pattern = "vehicle:*:location"
    keys = client.keys(pattern)
    result = {}
    for key in keys:
        data = client.get(key)
        if data:
            vehicle_id = key.split(":")[1]
            result[vehicle_id] = json.loads(data)
    return result


# ─── Alert Count ──────────────────────────────────────────────────────────────

def set_active_alert_count(count: int) -> None:
    key = redis_active_alert_count()
    client.setex(key, REDIS_TTL_ALERT_COUNT, str(count))


def get_active_alert_count() -> int | None:
    key = redis_active_alert_count()
    data = client.get(key)
    return int(data) if data else None