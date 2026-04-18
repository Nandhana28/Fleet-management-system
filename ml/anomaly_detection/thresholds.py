SPEED_LIMIT_KMPH = 80           # Alert if speed exceeds this
FUEL_DROP_THRESHOLD_PCT = 15    # Alert if fuel drops more than this in one reading
ROUTE_DEVIATION_KM = 2          # Alert if vehicle deviates more than this
OFFLINE_TIMEOUT_MINUTES = 10    # Alert if no GPS update for this long
IDLE_TIMEOUT_MINUTES = 15       # Alert if engine idle for this long

ANOMALY_SCORE_THRESHOLD = -0.05

# Severity mapping
SEVERITY = {
    "FUEL_THEFT": "CRITICAL",
    "OVERSPEEDING": "HIGH",
    "ROUTE_DEVIATION": "MEDIUM",
    "OFFLINE": "LOW",
}