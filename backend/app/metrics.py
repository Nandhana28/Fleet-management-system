from prometheus_client import Counter, Gauge, Histogram

# ─── Fleet Overview Metrics ─────────────────────────────────────────────────
vehicles_total = Gauge(
    'fleetpulse_vehicles_total',
    'Total number of vehicles being tracked'
)

active_alerts_total = Gauge(
    'fleetpulse_active_alerts_total',
    'Total number of active (unresolved) alerts'
)

alerts_total = Counter(
    'fleetpulse_alerts_total',
    'Total alerts created',
    ['type']  # Labels: fuel_theft, overspeeding, route_deviation, offline
)

# ─── Pipeline Health Metrics ───────────────────────────────────────────────
gps_records_total = Counter(
    'fleetpulse_gps_records_total',
    'Total GPS records processed'
)

lambda_errors_total = Counter(
    'fleetpulse_lambda_errors_total',
    'Total Lambda function errors'
)

# ─── Database & Cache Latency Metrics ──────────────────────────────────────
dynamodb_query_duration = Histogram(
    'dynamodb_query_duration_seconds',
    'DynamoDB query duration in seconds',
    ['operation'],  # Labels: get_item, query, scan, put_item, update_item
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
)

redis_operation_duration = Histogram(
    'redis_operation_duration_seconds',
    'Redis operation duration in seconds',
    ['operation'],  # Labels: get, set, delete, hgetall
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5)
)
