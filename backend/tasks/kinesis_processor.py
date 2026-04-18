"""
Celery task to process Kinesis GPS events and trigger anomaly detection.
This bridges the Lambda pipeline with the backend alert system.
"""
import os
import sys
import json
import boto3
from datetime import datetime

from tasks.celery_app import celery
from app.db import queries
from app.services.alert_service import analyze_gps_payload, create_alert_from_anomaly
from app.sockets.socket_server import emit_vehicle_update, emit_alert

# Add ML module to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)


def _get_boto_kwargs():
    if os.environ.get("USE_LOCALSTACK", "true").lower() == "true":
        endpoint = os.environ.get("LOCALSTACK_ENDPOINT", "http://localhost:4566")
        return {
            "endpoint_url": endpoint,
            "region_name": "ap-south-1",
            "aws_access_key_id": "test",
            "aws_secret_access_key": "test",
        }
    return {"region_name": os.environ.get("AWS_REGION", "ap-south-1")}


def _get_kinesis():
    return boto3.client("kinesis", **_get_boto_kwargs())


@celery.task(name="tasks.kinesis_processor.process_gps_event")
def process_gps_event(payload: dict):
    """
    Process a single GPS event from Kinesis.
    - Analyze for anomalies using ML
    - Create alerts if anomalies detected
    - Emit WebSocket updates
    """
    try:
        vehicle_id = payload.get("vehicle_id")
        if not vehicle_id:
            return {"error": "No vehicle_id in payload"}
        
        # Analyze GPS payload for anomalies
        alert_data = analyze_gps_payload(vehicle_id, payload)
        
        if alert_data:
            # Create alert in DynamoDB
            created_alert = create_alert_from_anomaly(alert_data)
            if created_alert:
                print(f"[Kinesis] Alert created: {alert_data['alert_type']} for {vehicle_id}")
                # Emit to WebSocket clients
                try:
                    import asyncio
                    asyncio.create_task(emit_alert(created_alert))
                except Exception as e:
                    print(f"[Kinesis] WebSocket emit failed: {e}")
                
                return {
                    "processed": True,
                    "alert_created": True,
                    "alert_type": alert_data['alert_type'],
                    "vehicle_id": vehicle_id,
                }
        
        return {
            "processed": True,
            "alert_created": False,
            "vehicle_id": vehicle_id,
        }
    
    except Exception as e:
        print(f"[Kinesis] Error processing GPS event: {e}")
        return {"error": str(e)}


@celery.task(name="tasks.kinesis_processor.consume_kinesis_stream")
def consume_kinesis_stream():
    """
    Periodically consume Kinesis stream and process events.
    Runs every 10 seconds via Celery Beat.
    """
    try:
        kinesis = _get_kinesis()
        
        # Get stream description
        stream_name = "fleet-gps-stream"
        try:
            resp = kinesis.describe_stream(StreamName=stream_name)
            shards = resp["StreamDescription"]["Shards"]
        except kinesis.exceptions.ResourceNotFoundException:
            print(f"[Kinesis] Stream {stream_name} not found")
            return {"error": "Stream not found"}
        
        total_processed = 0
        
        for shard in shards:
            shard_id = shard["ShardId"]
            
            # Get shard iterator
            try:
                iter_resp = kinesis.get_shard_iterator(
                    StreamName=stream_name,
                    ShardId=shard_id,
                    ShardIteratorType="LATEST",  # Only new records
                )
                shard_iterator = iter_resp["ShardIterator"]
            except Exception as e:
                print(f"[Kinesis] Failed to get shard iterator: {e}")
                continue
            
            # Read records
            try:
                records_resp = kinesis.get_records(
                    ShardIterator=shard_iterator,
                    Limit=100,
                )
                records = records_resp.get("Records", [])
                
                for record in records:
                    try:
                        payload = json.loads(record["Data"])
                        # Process asynchronously
                        process_gps_event.delay(payload)
                        total_processed += 1
                    except Exception as e:
                        print(f"[Kinesis] Failed to process record: {e}")
            
            except Exception as e:
                print(f"[Kinesis] Failed to read records: {e}")
        
        return {
            "processed": total_processed,
            "shards": len(shards),
        }
    
    except Exception as e:
        print(f"[Kinesis] Stream consumption failed: {e}")
        return {"error": str(e)}
