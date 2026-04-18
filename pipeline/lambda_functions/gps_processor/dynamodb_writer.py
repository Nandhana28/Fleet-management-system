import uuid
import boto3
import os
from datetime import datetime

def _get_client():
    if os.environ.get('USE_LOCALSTACK', 'true').lower() == 'true':
        endpoint = os.environ.get('LOCALSTACK_ENDPOINT', 'http://localhost:4566')
        return boto3.resource('dynamodb',
            endpoint_url=endpoint,
            region_name='ap-south-1',
            aws_access_key_id='test',
            aws_secret_access_key='test',
        )
    return boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'ap-south-1'))


def write_trip_record(payload: dict):
    """Write GPS reading as a trip record to DynamoDB Trips table."""
    db = _get_client()
    table = db.Table('Trips')
    trip_id = f"trip-{payload['vehicle_id']}-{int(datetime.utcnow().timestamp())}"
    item = {
        'trip_id': trip_id,
        'vehicle_id': payload['vehicle_id'],
        'driver_id': payload.get('driver_id', ''),
        'latitude': str(payload.get('latitude', 0)),
        'longitude': str(payload.get('longitude', 0)),
        'speed': str(payload.get('speed', 0)),
        'fuel_level': str(payload.get('fuel_level', 0)),
        'status': payload.get('status', 'moving'),
        'source': payload.get('source', ''),
        'dest': payload.get('dest', ''),
        'progress': str(payload.get('progress', 0)),
        'timestamp': payload.get('timestamp', datetime.utcnow().isoformat()),
        'resolved': False,
    }
    table.put_item(Item=item)
    print(f"[DynamoDB] Trip written: {trip_id}")


def update_vehicle_location(payload: dict):
    """Update vehicle's current location in DynamoDB Vehicles table."""
    db = _get_client()
    table = db.Table('Vehicles')
    try:
        table.update_item(
            Key={'vehicle_id': payload['vehicle_id']},
            UpdateExpression="""SET latitude = :lat, longitude = :lon,
                speed = :spd, fuel_level = :fuel,
                #st = :status, last_updated = :ts""",
            ExpressionAttributeNames={'#st': 'status'},
            ExpressionAttributeValues={
                ':lat': str(payload.get('latitude', 0)),
                ':lon': str(payload.get('longitude', 0)),
                ':spd': str(payload.get('speed', 0)),
                ':fuel': str(payload.get('fuel_level', 0)),
                ':status': payload.get('status', 'moving'),
                ':ts': payload.get('timestamp', datetime.utcnow().isoformat()),
            }
        )
        print(f"[DynamoDB] Vehicle updated: {payload['vehicle_id']}")
    except Exception as e:
        print(f"[DynamoDB] Error updating vehicle: {e}")


def write_alert(alert: dict):
    """Write anomaly alert to DynamoDB Alerts table."""
    db = _get_client()
    table = db.Table('Alerts')
    alert_id = str(uuid.uuid4())
    item = {
        'alert_id': alert_id,
        'vehicle_id': alert['vehicle_id'],
        'alert_type': alert['type'],
        'severity': alert['severity'],
        'message': alert['details'],
        'status': 'UNRESOLVED',
        'resolved': False,
        'timestamp': datetime.utcnow().isoformat(),
    }
    table.put_item(Item=item)
    print(f"[DynamoDB] Alert written: {alert_id} — {alert['type']}")
    return alert_id