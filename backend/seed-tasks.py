#!/usr/bin/env python3
"""Seed initial tasks to DynamoDB so simulator has work to do."""
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

LOCALSTACK = 'http://localhost:4566'
REGION = 'ap-south-1'

dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url=LOCALSTACK,
    region_name=REGION,
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

ROUTES = [
    ('vehicle-1', 'Gandhipuram Bus Stand', 'Coimbatore Airport', (11.0168, 76.9558), (11.0200, 76.9600)),
    ('vehicle-2', 'RS Puram', 'Peelamedu', (10.9987, 76.9508), (11.0050, 76.9650)),
    ('vehicle-3', 'Ukkadam', 'Singanallur', (10.9847, 76.9762), (11.0130, 77.0180)),
    ('vehicle-4', 'Tidel Park', 'Podanur Junction', (11.0130, 77.0180), (10.9987, 76.9508)),
    ('vehicle-5', 'Saibaba Colony', 'Ganapathy', (11.0080, 76.9720), (10.9847, 76.9762)),
    ('vehicle-6', 'Race Course', 'Vadavalli', (11.0050, 76.9650), (11.0168, 76.9558)),
    ('vehicle-7', 'Hopes College', 'Kuniyamuthur', (11.0200, 76.9600), (10.9987, 76.9508)),
    ('vehicle-8', 'Kovaipudur', 'Thondamuthur', (10.9500, 76.9650), (11.0080, 76.9720)),
    ('vehicle-9', 'Sulur', 'Kaniyur', (11.0330, 77.1200), (11.0050, 76.9650)),
    ('vehicle-10', 'Mettupalayam Road', 'Avinashi Road', (11.0400, 76.9700), (10.9500, 76.9650)),
]

table = dynamodb.Table('Tasks')

for vehicle_id, source, dest, start_coords, end_coords in ROUTES:
    task = {
        'task_id': str(uuid.uuid4()),
        'vehicle_id': vehicle_id,
        'driver_id': f'driver-{vehicle_id.split("-")[1]}',
        'source': source,
        'dest': dest,
        'start_coords': [Decimal(str(c)) for c in start_coords],
        'end_coords': [Decimal(str(c)) for c in end_coords],
        'status': 'active',
        'priority': 'medium',
        'created_at': datetime.utcnow().isoformat(),
    }
    table.put_item(Item=task)
    print(f'✅ Task for {vehicle_id}: {source} → {dest}')

print(f'\n✅ Seeded {len(ROUTES)} tasks')
