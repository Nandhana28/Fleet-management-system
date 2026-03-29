# backend/app/db/dynamodb.py
import boto3
from app.config import settings


def get_dynamodb_resource():
    """
    Returns a DynamoDB resource.
    Points to LocalStack when USE_LOCALSTACK=true,
    real AWS when USE_LOCALSTACK=false.
    """
    if settings.use_localstack:
        return boto3.resource(
            "dynamodb",
            endpoint_url=settings.localstack_endpoint,
            region_name=settings.aws_region,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )
    return boto3.resource(
        "dynamodb",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


def get_table(table_name: str):
    db = get_dynamodb_resource()
    return db.Table(table_name)
