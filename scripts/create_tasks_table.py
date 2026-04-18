import boto3, os

db = boto3.resource(
    'dynamodb',
    endpoint_url=os.getenv('LOCALSTACK_ENDPOINT', 'http://localhost:4566'),
    region_name='ap-south-1',
    aws_access_key_id='test',
    aws_secret_access_key='test',
)

def create_tasks_table():
    try:
        table = db.create_table(
            TableName='Tasks',
            KeySchema=[{'AttributeName': 'task_id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[
                {'AttributeName': 'task_id', 'AttributeType': 'S'},
                {'AttributeName': 'vehicle_id', 'AttributeType': 'S'},
            ],
            GlobalSecondaryIndexes=[{
                'IndexName': 'vehicle-index',
                'KeySchema': [{'AttributeName': 'vehicle_id', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5},
            }],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5},
        )
        table.wait_until_exists()
        print('Tasks table created')
    except Exception as e:
        if 'ResourceInUseException' in str(e):
            print('Tasks table already exists')
        else:
            raise

if __name__ == '__main__':
    create_tasks_table()