#!/bin/bash

# Capture Docker Compose logs to files
# Usage: ./scripts/capture-logs.sh

LOGS_DIR="logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

echo "Capturing Docker Compose logs..."

# Create timestamped log files
docker-compose logs backend > "$LOGS_DIR/backend/backend_$TIMESTAMP.log" 2>&1
docker-compose logs frontend > "$LOGS_DIR/frontend/frontend_$TIMESTAMP.log" 2>&1
docker-compose logs redis > "$LOGS_DIR/services/redis_$TIMESTAMP.log" 2>&1
docker-compose logs localstack > "$LOGS_DIR/services/localstack_$TIMESTAMP.log" 2>&1
docker-compose logs celery-worker > "$LOGS_DIR/services/celery_$TIMESTAMP.log" 2>&1
docker-compose logs celery-beat > "$LOGS_DIR/services/celery-beat_$TIMESTAMP.log" 2>&1

echo "Logs captured to $LOGS_DIR/"
echo "Backend: $LOGS_DIR/backend/backend_$TIMESTAMP.log"
echo "Frontend: $LOGS_DIR/frontend/frontend_$TIMESTAMP.log"
echo "Services: $LOGS_DIR/services/"
