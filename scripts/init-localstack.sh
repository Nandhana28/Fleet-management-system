#!/bin/bash
# scripts/init-localstack.sh
# Runs inside LocalStack container on startup — creates all AWS resources

set -e

ENDPOINT="http://localhost:4566"
REGION="ap-south-1"
AWS="aws --endpoint-url=$ENDPOINT --region=$REGION"

echo "⏳ Waiting for LocalStack to be ready..."
until curl -sf "$ENDPOINT/_localstack/health" | grep -q '"dynamodb": "running"'; do
  sleep 2
done
echo "✅ LocalStack is ready"

# ─── DynamoDB Tables ──────────────────────────────────────────────────────────

create_table() {
  TABLE=$1
  shift
  if $AWS dynamodb describe-table --table-name "$TABLE" > /dev/null 2>&1; then
    echo "  ⏩ Already exists: $TABLE"
  else
    $AWS dynamodb create-table --table-name "$TABLE" "$@" \
      --billing-mode PAY_PER_REQUEST > /dev/null
    echo "  ✅ Created: $TABLE"
  fi
}

echo ""
echo "📦 Creating DynamoDB tables..."

create_table Vehicles \
  --key-schema AttributeName=vehicle_id,KeyType=HASH \
  --attribute-definitions AttributeName=vehicle_id,AttributeType=S

create_table Trips \
  --key-schema AttributeName=trip_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
  --attribute-definitions AttributeName=trip_id,AttributeType=S AttributeName=timestamp,AttributeType=S

create_table Alerts \
  --key-schema AttributeName=alert_id,KeyType=HASH \
  --attribute-definitions AttributeName=alert_id,AttributeType=S

create_table Drivers \
  --key-schema AttributeName=driver_id,KeyType=HASH \
  --attribute-definitions AttributeName=driver_id,AttributeType=S

create_table AgentConfig \
  --key-schema AttributeName=config_key,KeyType=HASH \
  --attribute-definitions AttributeName=config_key,AttributeType=S

create_table Users \
  --key-schema AttributeName=user_id,KeyType=HASH \
  --attribute-definitions AttributeName=user_id,AttributeType=S AttributeName=email,AttributeType=S \
  --global-secondary-indexes IndexName=email-index,KeySchema=["{AttributeName=email,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}"

create_table Tasks \
  --key-schema AttributeName=task_id,KeyType=HASH \
  --attribute-definitions AttributeName=task_id,AttributeType=S

create_table MaintenanceRecords \
  --key-schema AttributeName=record_id,KeyType=HASH \
  --attribute-definitions AttributeName=record_id,AttributeType=S

create_table Notifications \
  --key-schema AttributeName=notification_id,KeyType=HASH \
  --attribute-definitions AttributeName=notification_id,AttributeType=S

create_table ActivityLog \
  --key-schema AttributeName=activity_id,KeyType=HASH \
  --attribute-definitions AttributeName=activity_id,AttributeType=S

# ─── Kinesis Stream ───────────────────────────────────────────────────────────

echo ""
echo "📡 Creating Kinesis stream..."
if $AWS kinesis describe-stream --stream-name fleet-gps-stream > /dev/null 2>&1; then
  echo "  ⏩ Already exists: fleet-gps-stream"
else
  $AWS kinesis create-stream --stream-name fleet-gps-stream --shard-count 1
  echo "  ✅ Created: fleet-gps-stream"
fi

# ─── S3 Bucket ────────────────────────────────────────────────────────────────

echo ""
echo "🪣 Creating S3 bucket..."
if $AWS s3api head-bucket --bucket fleetpulse-data > /dev/null 2>&1; then
  echo "  ⏩ Already exists: fleetpulse-data"
else
  $AWS s3api create-bucket \
    --bucket fleetpulse-data \
    --create-bucket-configuration LocationConstraint=$REGION
  echo "  ✅ Created: fleetpulse-data"
fi

# ─── SNS Topic ────────────────────────────────────────────────────────────────

echo ""
echo "📣 Creating SNS topic..."
$AWS sns create-topic --name fleet-alerts > /dev/null
echo "  ✅ SNS topic ready: fleet-alerts"

# ─── SQS Queue ────────────────────────────────────────────────────────────────

echo ""
echo "📬 Creating SQS queue..."
$AWS sqs create-queue --queue-name fleet-alert-queue > /dev/null
echo "  ✅ SQS queue ready: fleet-alert-queue"

echo ""
echo "🎉 LocalStack init complete — all resources ready!"