import json
import sys
import os

from dynamodb_writer import write_trip_record, update_vehicle_location, write_alert
from redis_writer import write_location_cache

# Add project root for ML module
_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _root not in sys.path:
    sys.path.insert(0, _root)


def handler(event, context):
    """
    GPS Processor Lambda
    SQS/Kinesis -> DynamoDB Trips + Vehicles + Redis Cache + Anomaly Detection
    """
    records = event.get('Records', [])
    print(f"[GPS Processor] Processing {len(records)} records")
    success, errors = 0, 0

    # Load ML model once per Lambda invocation
    analyzer = None
    try:
        from ml.anomaly_detection.predictor import analyze
        analyzer = analyze
        print("[GPS Processor] ML model loaded")
    except Exception as e:
        print(f"[GPS Processor] ML model unavailable: {e}")

    # Track previous fuel levels for theft detection
    prev_fuel = {}

    for record in records:
        try:
            # Handle both SQS and Kinesis event formats
            if 'body' in record:
                payload = json.loads(record['body'])
            elif 'kinesis' in record:
                import base64
                payload = json.loads(base64.b64decode(record['kinesis']['data']))
            else:
                payload = record

            vehicle_id = payload.get('vehicle_id', 'unknown')

            # Write to DynamoDB and Redis
            write_trip_record(payload)
            update_vehicle_location(payload)
            write_location_cache(payload)

            # Run anomaly detection
            if analyzer:
                prev = prev_fuel.get(vehicle_id)
                result = analyzer(payload, previous_fuel=prev)
                prev_fuel[vehicle_id] = float(payload.get('fuel_level', 100))

                if result['is_anomaly']:
                    for anomaly in result['anomaly_types']:
                        anomaly['vehicle_id'] = vehicle_id
                        write_alert(anomaly)
                        print(f"[GPS Processor] Alert: {anomaly['type']} on {vehicle_id}")

            success += 1
            print(f"[GPS Processor] OK: {vehicle_id}")

        except Exception as e:
            print(f"[GPS Processor] Error: {e}")
            errors += 1

    return {
        'statusCode': 200,
        'body': json.dumps({'success': success, 'errors': errors})
    }