#!/bin/bash
# scripts/deploy-lambdas.sh
# Deploy Lambda functions to LocalStack

set -e

ENDPOINT="http://localhost:4566"
REGION="ap-south-1"
AWS="aws --endpoint-url=$ENDPOINT --region=$REGION"

echo "📦 Deploying Lambda functions to LocalStack..."

# Create IAM role for Lambda
echo "🔐 Creating Lambda execution role..."
ROLE_ARN=$($AWS iam create-role \
  --role-name fleet-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \
  --query 'Role.Arn' \
  --output text 2>/dev/null || echo "arn:aws:iam::000000000000:role/fleet-lambda-role")

echo "  ✅ Role: $ROLE_ARN"

# Deploy GPS Processor Lambda
echo ""
echo "📡 Deploying GPS Processor Lambda..."
cd pipeline/lambda_functions/gps_processor
zip -q -r /tmp/gps_processor.zip . 2>/dev/null || true
$AWS lambda create-function \
  --function-name fleet-gps-processor \
  --runtime python3.11 \
  --role "$ROLE_ARN" \
  --handler handler.handler \
  --zip-file fileb:///tmp/gps_processor.zip \
  --timeout 60 \
  --environment Variables="{LOCALSTACK_ENDPOINT=$ENDPOINT,AWS_REGION=$REGION}" \
  2>/dev/null || echo "  ⏩ Already exists"
echo "  ✅ GPS Processor deployed"
cd - > /dev/null

# Deploy Anomaly Detector Lambda
echo ""
echo "🔍 Deploying Anomaly Detector Lambda..."
cd pipeline/lambda_functions
zip -q -r /tmp/anomaly_detector.zip anomaly_detector.py 2>/dev/null || true
$AWS lambda create-function \
  --function-name fleet-anomaly-detector \
  --runtime python3.11 \
  --role "$ROLE_ARN" \
  --handler anomaly_detector.handler \
  --zip-file fileb:///tmp/anomaly_detector.zip \
  --timeout 60 \
  --environment Variables="{LOCALSTACK_ENDPOINT=$ENDPOINT,AWS_REGION=$REGION}" \
  2>/dev/null || echo "  ⏩ Already exists"
echo "  ✅ Anomaly Detector deployed"
cd - > /dev/null

# Deploy Alert Dispatcher Lambda
echo ""
echo "📣 Deploying Alert Dispatcher Lambda..."
cd pipeline/lambda_functions/alert_dispatcher
zip -q -r /tmp/alert_dispatcher.zip . 2>/dev/null || true
$AWS lambda create-function \
  --function-name fleet-alert-dispatcher \
  --runtime python3.11 \
  --role "$ROLE_ARN" \
  --handler handler.handler \
  --zip-file fileb:///tmp/alert_dispatcher.zip \
  --timeout 60 \
  --environment Variables="{LOCALSTACK_ENDPOINT=$ENDPOINT,AWS_REGION=$REGION}" \
  2>/dev/null || echo "  ⏩ Already exists"
echo "  ✅ Alert Dispatcher deployed"
cd - > /dev/null

# Create Kinesis event source mapping
echo ""
echo "🔗 Creating Kinesis → Lambda event mapping..."
$AWS lambda create-event-source-mapping \
  --event-source-arn "arn:aws:kinesis:$REGION:000000000000:stream/fleet-gps-stream" \
  --function-name fleet-gps-processor \
  --enabled \
  --batch-size 100 \
  --starting-position LATEST \
  2>/dev/null || echo "  ⏩ Already exists"
echo "  ✅ Event mapping created"

echo ""
echo "🎉 Lambda deployment complete!"
