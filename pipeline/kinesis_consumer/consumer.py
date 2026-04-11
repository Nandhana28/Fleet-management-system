import boto3

# import json

sqs_client = boto3.client("sqs", region_name="ap-south-1")
SQS_QUEUE_URL = (
    "https://sqs.ap-south-1.amazonaws.com/" "746491203215/fleetpulse-gps-queue"
)


def poll_messages(max_messages=10):
    """Poll SQS queue for GPS messages"""
    response = sqs_client.receive_message(
        QueueUrl=SQS_QUEUE_URL,
        MaxNumberOfMessages=max_messages,
        WaitTimeSeconds=10,
    )
    messages = response.get("Messages", [])
    print(f"📦 Received {len(messages)} messages")
    return messages


def delete_message(receipt_handle):
    """Delete processed message from queue"""
    sqs_client.delete_message(
        QueueUrl=SQS_QUEUE_URL,
        ReceiptHandle=receipt_handle,
    )
