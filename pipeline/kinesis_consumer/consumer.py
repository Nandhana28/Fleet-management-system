"""
Kinesis Consumer — polls Kinesis stream and processes GPS payloads.
Runs locally as a background process to simulate Lambda trigger.
"""
import json
import os
import sys
import time
import base64
import boto3

_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _root not in sys.path:
    sys.path.insert(0, _root)

# Import GPS processor handler
sys.path.insert(0, os.path.join(_root, 'pipeline', 'lambda_functions', 'gps_processor'))
from handler import handler as gps_handler


def _get_kinesis():
    if os.environ.get('USE_LOCALSTACK', 'true').lower() == 'true':
        return boto3.client('kinesis',
            endpoint_url=os.environ.get('LOCALSTACK_ENDPOINT', 'http://localhost:4566'),
            region_name='ap-south-1',
            aws_access_key_id='test',
            aws_secret_access_key='test',
        )
    return boto3.client('kinesis', region_name='ap-south-1')


def consume(stream_name: str = 'fleetpulse-gps-stream', poll_interval: int = 5):
    """Poll Kinesis stream and process records."""
    print(f"[Consumer] Starting — stream: {stream_name}")
    kinesis = _get_kinesis()

    try:
        resp = kinesis.describe_stream(StreamName=stream_name)
        shards = resp['StreamDescription']['Shards']
        print(f"[Consumer] Found {len(shards)} shards")
    except Exception as e:
        print(f"[Consumer] Cannot connect to Kinesis: {e}")
        return

    # Get shard iterator for each shard
    iterators = {}
    for shard in shards:
        shard_id = shard['ShardId']
        resp = kinesis.get_shard_iterator(
            StreamName=stream_name,
            ShardId=shard_id,
            ShardIteratorType='LATEST'
        )
        iterators[shard_id] = resp['ShardIterator']

    print(f"[Consumer] Polling every {poll_interval}s...")

    while True:
        for shard_id, iterator in list(iterators.items()):
            try:
                resp = kinesis.get_records(ShardIterator=iterator, Limit=100)
                records = resp.get('Records', [])

                if records:
                    # Format as Lambda event
                    lambda_event = {
                        'Records': [
                            {
                                'kinesis': {
                                    'data': base64.b64encode(r['Data']).decode()
                                }
                            }
                            for r in records
                        ]
                    }
                    gps_handler(lambda_event, None)
                    print(f"[Consumer] Processed {len(records)} records from {shard_id}")

                iterators[shard_id] = resp['NextShardIterator']

            except Exception as e:
                print(f"[Consumer] Shard error: {e}")

        time.sleep(poll_interval)


if __name__ == '__main__':
    consume()