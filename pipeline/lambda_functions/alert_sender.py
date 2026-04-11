import json
import boto3

# from datetime import datetime

# AWS clients
sns_client = boto3.client("sns", region_name="ap-south-1")
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
alerts_table = dynamodb.Table("Alerts")

# Alert message templates
ALERT_MESSAGES = {
    "OVERSPEEDING": "🚨 SPEED ALERT: Vehicle {vehicle_id} is overspeeding! {details}. Location: {lat}, {lon}. Time: {time}",
    "FUEL_THEFT": "🚨 FUEL ALERT: Possible fuel theft detected on {vehicle_id}! {details}. Location: {lat}, {lon}. Time: {time}",
}


def format_alert_message(alert):
    """Format alert into human readable message"""
    template = ALERT_MESSAGES.get(
        alert["anomaly_type"], "🚨 ALERT: {vehicle_id} — {details}"
    )
    return template.format(
        vehicle_id=alert["vehicle_id"],
        details=alert["details"],
        lat=alert["latitude"],
        lon=alert["longitude"],
        time=alert["timestamp"],
    )


def send_sns_notification(alert, message):
    """Send alert via AWS SNS — triggers WhatsApp/SMS/Email"""
    try:
        response = sns_client.publish(
            TopicArn="arn:aws:sns:ap-south-1:placeholder:fleetpulse-alerts",
            Message=message,
            Subject=f"FleetPulse Alert — {alert['anomaly_type']}",
            MessageAttributes={
                "vehicle_id": {
                    "DataType": "String",
                    "StringValue": alert["vehicle_id"],
                },
                "severity": {
                    "DataType": "String",
                    "StringValue": alert["severity"],
                },
            },
        )
        print(f"✅ SNS notification sent: {response['MessageId']}")
        return response["MessageId"]
    except Exception as e:
        print(f"❌ SNS error: {str(e)}")
        return None


def update_alert_status(alert_id, message_id):
    """Update alert record to mark notification as sent"""
    alerts_table.update_item(
        Key={"alert_id": alert_id},
        UpdateExpression="SET notification_sent = :sent, message_id = :mid",
        ExpressionAttributeValues={
            ":sent": True,
            ":mid": message_id or "failed",
        },
    )


def handler(event, context):
    """
    Alert Sender Lambda
    Receives anomaly alerts and sends notifications via SNS
    Triggered by SNS topic when anomaly_detector saves an alert
    """
    print(f"📨 Processing {len(event['Records'])} alerts")

    sent_count = 0
    failed_count = 0

    for record in event["Records"]:
        try:
            # Parse alert from SNS message
            sns_message = record["Sns"]["Message"]
            alert = json.loads(sns_message)

            print(
                f"📨 Sending alert for {alert['vehicle_id']} "
                f"— {alert['anomaly_type']}"
            )

            # Format human readable message
            message = format_alert_message(alert)
            print(f"📝 Message: {message}")

            # Send via SNS
            message_id = send_sns_notification(alert, message)

            # Update alert record
            update_alert_status(alert["alert_id"], message_id)

            sent_count += 1

        except Exception as e:
            print(f"❌ Error sending alert: {str(e)}")
            failed_count += 1

    print(f"✅ Done! Sent: {sent_count}, Failed: {failed_count}")
    return {
        "statusCode": 200,
        "body": json.dumps({"sent": sent_count, "failed": failed_count}),
    }
