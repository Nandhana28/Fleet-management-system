import json
import boto3
from datetime import datetime

# AWS clients
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
alerts_table = dynamodb.Table("Alerts")
sns_client = boto3.client("sns", region_name="ap-south-1")

# Anomaly thresholds
SPEED_THRESHOLD = 80  # km/h — above this is overspeeding
FUEL_DROP_THRESHOLD = 15  # % — sudden drop above this is fuel theft
PREVIOUS_FUEL = {}  # Store last fuel reading per vehicle


def detect_overspeeding(payload):
    """Check if vehicle is overspeeding"""
    if float(payload["speed"]) > SPEED_THRESHOLD:
        return {
            "anomaly_type": "OVERSPEEDING",
            "details": f"Speed {payload['speed']} km/h exceeds {SPEED_THRESHOLD} km/h limit",
            "severity": "HIGH",
        }
    return None


def detect_fuel_theft(payload):
    """Check for sudden fuel drop — indicates fuel theft"""
    vehicle_id = payload["vehicle_id"]
    current_fuel = float(payload["fuel_level"])

    if vehicle_id in PREVIOUS_FUEL:
        fuel_drop = PREVIOUS_FUEL[vehicle_id] - current_fuel
        if fuel_drop > FUEL_DROP_THRESHOLD:
            return {
                "anomaly_type": "FUEL_THEFT",
                "details": f"Fuel dropped {fuel_drop:.1f}% suddenly (from {PREVIOUS_FUEL[vehicle_id]}% to {current_fuel}%)",
                "severity": "CRITICAL",
            }

    # Update previous fuel reading
    PREVIOUS_FUEL[vehicle_id] = current_fuel
    return None


def save_alert(payload, anomaly):
    """Save anomaly alert to DynamoDB Alerts table"""
    alert_id = (
        f"{payload['vehicle_id']}-{anomaly['anomaly_type']}-{payload['timestamp']}"
    )

    alert_record = {
        "alert_id": alert_id,
        "vehicle_id": payload["vehicle_id"],
        "driver_id": payload["driver_id"],
        "anomaly_type": anomaly["anomaly_type"],
        "details": anomaly["details"],
        "severity": anomaly["severity"],
        "latitude": str(payload["latitude"]),
        "longitude": str(payload["longitude"]),
        "timestamp": payload["timestamp"],
        "status": "UNRESOLVED",
        "created_at": datetime.utcnow().isoformat(),
    }

    alerts_table.put_item(Item=alert_record)
    print(f"🚨 Alert saved: {alert_record['alert_id']}")
    return alert_record


def handler(event, context):
    """
    Anomaly Detector Lambda
    Checks each GPS payload for overspeeding and fuel theft
    Triggered by Kinesis stream alongside kinesis_consumer
    """
    print(f"🔍 Checking {len(event['Records'])} records for anomalies")

    anomalies_found = 0

    for record in event["Records"]:
        try:
            import base64

            raw_data = base64.b64decode(record["kinesis"]["data"]).decode("utf-8")
            payload = json.loads(raw_data)

            # Run anomaly checks
            anomalies = [
                detect_overspeeding(payload),
                detect_fuel_theft(payload),
            ]

            # Filter out None results
            anomalies = [a for a in anomalies if a is not None]

            # Save each anomaly as an alert
            for anomaly in anomalies:
                save_alert(payload, anomaly)
                anomalies_found += 1
                print(
                    f"🚨 {anomaly['anomaly_type']} detected "
                    f"for {payload['vehicle_id']}"
                )

        except Exception as e:
            print(f"❌ Error: {str(e)}")

    print(f"✅ Done! {anomalies_found} anomalies found")
    return {"statusCode": 200, "body": json.dumps({"anomalies_found": anomalies_found})}
