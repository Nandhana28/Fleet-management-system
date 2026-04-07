import json
from sns_publisher import publish_alert


def handler(event, context):
    """
    Alert Dispatcher Lambda
    DynamoDB Streams → SNS → WhatsApp/SMS/Email
    """
    print(f"📨 Processing {len(event['Records'])} alerts")
    sent = 0

    for record in event["Records"]:
        try:
            if record["eventName"] in ["INSERT", "MODIFY"]:
                new_image = record["dynamodb"].get("NewImage", {})
                alert = {k: list(v.values())[0] for k, v in new_image.items()}
                if alert.get("status") == "UNRESOLVED":
                    publish_alert(alert)
                    sent += 1
        except Exception as e:
            print(f"❌ Error: {str(e)}")

    print(f"✅ Done! Sent: {sent} alerts")
    return {"statusCode": 200, "body": json.dumps({"sent": sent})}
