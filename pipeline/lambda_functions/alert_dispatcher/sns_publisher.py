import os
import json
import boto3


def _get_sns():
    if os.environ.get('USE_LOCALSTACK', 'true').lower() == 'true':
        return boto3.client('sns',
            endpoint_url=os.environ.get('LOCALSTACK_ENDPOINT', 'http://localhost:4566'),
            region_name='ap-south-1',
            aws_access_key_id='test',
            aws_secret_access_key='test',
        )
    return boto3.client('sns', region_name='ap-south-1')


def publish_alert(alert: dict):
    """Publish alert to SNS topic."""
    try:
        sns = _get_sns()
        topic_arn = os.environ.get(
            'SNS_TOPIC_ARN',
            'arn:aws:sns:ap-south-1:000000000000:fleetpulse-alerts'
        )
        message = (
            f"FleetPulse Alert\n"
            f"Type: {alert.get('alert_type', alert.get('type', 'Unknown'))}\n"
            f"Vehicle: {alert.get('vehicle_id', 'Unknown')}\n"
            f"Severity: {alert.get('severity', 'Unknown')}\n"
            f"Details: {alert.get('message', alert.get('details', ''))}"
        )
        sns.publish(TopicArn=topic_arn, Message=message, Subject='FleetPulse Alert')
        print(f"[SNS] Alert published for {alert.get('vehicle_id')}")
    except Exception as e:
        print(f"[SNS] Error: {e}")  