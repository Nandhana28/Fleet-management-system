import boto3

db = boto3.client(
    "dynamodb",
    endpoint_url="http://localhost:4566",
    region_name="ap-south-1",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

tables = [
    {
        "TableName": "Vehicles",
        "KeySchema": [{"AttributeName": "vehicle_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "vehicle_id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "Trips",
        "KeySchema": [
            {"AttributeName": "trip_id", "KeyType": "HASH"},
            {"AttributeName": "timestamp", "KeyType": "RANGE"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "trip_id", "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "Alerts",
        "KeySchema": [{"AttributeName": "alert_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "alert_id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "Drivers",
        "KeySchema": [{"AttributeName": "driver_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "driver_id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "AgentConfig",
        "KeySchema": [{"AttributeName": "config_key", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "config_key", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
]

for t in tables:
    try:
        db.create_table(**t)
        print(f"  Created: {t['TableName']}")
    except db.exceptions.ResourceInUseException:
        print(f"  Already exists: {t['TableName']}")

print("\nAll tables ready.")