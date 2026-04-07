# DynamoDB Table Names
VEHICLES_TABLE = "Vehicles"
TRIPS_TABLE = "Trips"
ALERTS_TABLE = "Alerts"
DRIVERS_TABLE = "Drivers"
AGENT_CONFIG_TABLE = "AgentConfig"

# Redis Key Formats
VEHICLE_LOCATION_KEY = "vehicle:location:{vehicle_id}"
AGENT_MEMORY_KEY = "agent:memory:{session_id}"

# SQS
SQS_QUEUE_URL = (
    "https://sqs.ap-south-1.amazonaws.com/" "746491203215/fleetpulse-gps-queue"
)

# AWS
AWS_REGION = "ap-south-1"
S3_BUCKET = "fleetpulse-terraform-state-farhana"
MODEL_KEY = "models/anomaly_detection_model.pkl"

# Anomaly Thresholds
SPEED_THRESHOLD = 80
FUEL_DROP_THRESHOLD = 15
ROUTE_DEVIATION_KM = 2

# Cache TTL
LOCATION_CACHE_TTL = 300  # 5 minutes
AGENT_MEMORY_TTL = 3600  # 1 hour
