import boto3
import json

sns_client = boto3.client("sns", region_name="ap-south-1")
SNS_TOPIC_ARN = "arn:aws:sns:ap-south-1:746491203215:fleetpulse-alerts"


def publish_alert(alert: dict) -> dict:
    """Publish anomaly alert to SNS topic"""
    try:
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(alert),
            Subject=f"FleetPulse Alert — {alert['anomaly_type']}",
        )
        print(f"✅ SNS published: {response['MessageId']}")
        return {"success": True, "message_id": response["MessageId"]}
    except Exception as e:
        print(f"❌ SNS error: {str(e)}")
        return {"success": False, "error": str(e)}
