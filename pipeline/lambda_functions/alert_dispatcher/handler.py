import json
import os
import sys

from sns_publisher import publish_alert
from twilio_sender import send_whatsapp

# Add project root for shared modules
_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _root not in sys.path:
    sys.path.insert(0, _root)


def _get_settings_phone():
    """Get WhatsApp number from DynamoDB AgentConfig settings."""
    try:
        import boto3
        if os.environ.get('USE_LOCALSTACK', 'true').lower() == 'true':
            db = boto3.resource('dynamodb',
                endpoint_url=os.environ.get('LOCALSTACK_ENDPOINT', 'http://localhost:4566'),
                region_name='ap-south-1',
                aws_access_key_id='test',
                aws_secret_access_key='test',
            )
        else:
            db = boto3.resource('dynamodb', region_name='ap-south-1')

        table = db.Table('AgentConfig')
        resp = table.scan()
        for item in resp.get('Items', []):
            notifs = item.get('notifications', {})
            phone = notifs.get('whatsapp', '')
            if phone:
                return phone
    except Exception as e:
        print(f"[AlertDispatcher] Could not fetch settings: {e}")
    return os.environ.get('ALERT_PHONE', '')


def handler(event, context):
    """
    Alert Dispatcher Lambda
    DynamoDB Streams -> SNS -> WhatsApp/SMS
    """
    records = event.get('Records', [])
    print(f"[AlertDispatcher] Processing {len(records)} records")
    sent = 0

    phone = _get_settings_phone()

    for record in records:
        try:
            if record.get('eventName') in ['INSERT', 'MODIFY']:
                new_image = record['dynamodb'].get('NewImage', {})
                # Deserialize DynamoDB format
                alert = {k: list(v.values())[0] for k, v in new_image.items()}

                if alert.get('status') == 'UNRESOLVED':
                    # Publish to SNS
                    publish_alert(alert)

                    # Send WhatsApp directly
                    if phone:
                        msg = (
                            f"FleetPulse Alert\n"
                            f"Type: {alert.get('alert_type', 'Unknown')}\n"
                            f"Vehicle: {alert.get('vehicle_id', 'Unknown')}\n"
                            f"Severity: {alert.get('severity', 'Unknown')}\n"
                            f"{alert.get('message', '')}"
                        )
                        send_whatsapp(phone, msg)

                    sent += 1

        except Exception as e:
            print(f"[AlertDispatcher] Error: {e}")

    return {
        'statusCode': 200,
        'body': json.dumps({'sent': sent})
    }