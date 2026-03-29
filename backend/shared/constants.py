VEHICLES_TABLE = "Vehicles"
TRIPS_TABLE = "Trips"
ALERTS_TABLE = "Alerts"
DRIVERS_TABLE = "Drivers"
AGENT_CONFIG_TABLE = "AgentConfig"

VEHICLE_PK = "vehicle_id"
TRIP_PK = "trip_id"
TRIP_SK = "timestamp"
ALERT_PK = "alert_id"
DRIVER_PK = "driver_id"
AGENT_CONFIG_PK = "config_key"


def redis_vehicle_location(vehicle_id: str) -> str:
    return f"vehicle:{vehicle_id}:location"

def redis_active_alert_count() -> str:
    return "alerts:active:count"

def redis_agent_history(user_id: str) -> str:
    return f"agent:session:{user_id}:history"

AWS_REGION = "ap-south-1"
MAP_CENTER_LAT = 11.0168
MAP_CENTER_LNG = 76.9558

# Redis TTL values (seconds)
REDIS_TTL_VEHICLE_LOCATION = 60
REDIS_TTL_ALERT_COUNT = 30
REDIS_TTL_AGENT_HISTORY = 3600
REDIS_TTL_SETTINGS = 300