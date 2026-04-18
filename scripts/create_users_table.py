import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import boto3
from app.config import settings

def create_users_table():
    client = boto3.client(
        'dynamodb',
        region_name='ap-south-1',  # was us-east-1
        endpoint_url='http://localhost:4566',
        aws_access_key_id='test',
        aws_secret_access_key='test',
    )
    try:
        client.create_table(
            TableName='Users',
            KeySchema=[{ 'AttributeName': 'user_id', 'KeyType': 'HASH' }],
            AttributeDefinitions=[
                { 'AttributeName': 'user_id', 'AttributeType': 'S' },
                { 'AttributeName': 'email', 'AttributeType': 'S' },
            ],
            GlobalSecondaryIndexes=[{
                'IndexName': 'email-index',
                'KeySchema': [{ 'AttributeName': 'email', 'KeyType': 'HASH' }],
                'Projection': { 'ProjectionType': 'ALL' },
            }],
            BillingMode='PAY_PER_REQUEST',
        )
        print("Users table created.")
    except client.exceptions.ResourceInUseException:
        print("Users table already exists.")

if __name__ == '__main__':
    create_users_table()