import boto3
from botocore.config import Config

dynamodb = boto3.resource(
    "dynamodb",
    endpoint_url="http://127.0.0.1:4566",
    region_name="ap-south-1",
    aws_access_key_id="test",
    aws_secret_access_key="test",
    config=Config(retries={"max_attempts": 3}),
)

def create_maintenance_table():
    try:
        table = dynamodb.create_table(
            TableName="Maintenance",
            KeySchema=[{"AttributeName": "maintenance_id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "maintenance_id", "AttributeType": "S"},
                {"AttributeName": "vehicle_id", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "vehicle-index",
                    "KeySchema": [{"AttributeName": "vehicle_id", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
                }
            ],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        table.wait_until_exists()
        print(" Maintenance table created")
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        print("  Maintenance table already exists — skipping")

if __name__ == "__main__":
    create_maintenance_table()