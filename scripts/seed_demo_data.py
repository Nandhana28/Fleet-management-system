import sys, os, uuid, random, boto3
from datetime import datetime, timedelta
from decimal import Decimal

LOCALSTACK_ENDPOINT = os.getenv('LOCALSTACK_ENDPOINT', 'http://localhost:4566')
db = boto3.resource(
    'dynamodb',
    endpoint_url=LOCALSTACK_ENDPOINT,
    region_name='ap-south-1',
    aws_access_key_id='test',
    aws_secret_access_key='test',
)

TN_REGISTRATIONS = [
    'TN 33 AB 1234', 'TN 33 CD 5678', 'TN 33 EF 9012',
    'TN 38 GH 3456', 'TN 38 IJ 7890', 'TN 11 KL 1111',
    'TN 11 MN 2222', 'TN 04 OP 3333', 'TN 04 QR 4444', 'TN 99 ST 5555'
]

DRIVER_NAMES = [
    'Murugan K', 'Selvam R', 'Ravi S', 'Kannan T', 'Balu M',
    'Senthil P', 'Arjun V', 'Dinesh C', 'Mani L', 'Kumar N'
]

VEHICLE_TYPES = ['lorry', 'van', 'bus', 'auto']

# Coimbatore landmarks for dropdowns
LANDMARKS = [
    'Gandhipuram Bus Stand',
    'Coimbatore Airport',
    'RS Puram',
    'Peelamedu',
    'Ukkadam',
    'Singanallur',
    'Tidel Park',
    'Podanur Junction',
    'Saibaba Colony',
    'Ganapathy',
    'Race Course',
    'Vadavalli',
    'Hopes College',
    'Kuniyamuthur',
    'Kovaipudur',
    'Thondamuthur',
    'Sulur',
    'Kaniyur',
    'Mettupalayam Road',
    'Avinashi Road',
    'Town Hall',
    'CODISSIA',
    'Brookefields Mall',
    'Prozone Mall',
    'Coimbatore Junction',
]

# 3 pre-seeded tasks that start automatically
PRE_SEEDED_TASKS = [
    {
        'task_id': 'task-seed-1',
        'vehicle_id': 'vehicle-1',
        'driver_id': 'driver-1',
        'source': 'Gandhipuram Bus Stand',
        'dest': 'Coimbatore Airport',
        'start_coords': [11.0168, 76.9558],
        'end_coords': [11.0275, 77.0433],
        'status': 'active',
        'priority': 'high',
        'notes': 'Airport cargo delivery',
    },
    {
        'task_id': 'task-seed-2',
        'vehicle_id': 'vehicle-2',
        'driver_id': 'driver-2',
        'source': 'RS Puram',
        'dest': 'Peelamedu',
        'start_coords': [10.9987, 76.9508],
        'end_coords': [11.0168, 77.0081],
        'status': 'active',
        'priority': 'medium',
        'notes': 'Goods transport',
    },
    {
        'task_id': 'task-seed-3',
        'vehicle_id': 'vehicle-3',
        'driver_id': 'driver-3',
        'source': 'Ukkadam',
        'dest': 'Singanallur',
        'start_coords': [10.9847, 76.9762],
        'end_coords': [11.0012, 77.0289],
        'status': 'active',
        'priority': 'low',
        'notes': 'Passenger transport',
    },
]


def seed_vehicles():
    table = db.Table('Vehicles')
    print('Seeding Vehicles...')
    for i in range(1, 11):
        table.put_item(Item={
            'vehicle_id': f'vehicle-{i}',
            'driver_id': f'driver-{i}',
            'registration': TN_REGISTRATIONS[i - 1],
            'type': random.choice(VEHICLE_TYPES),
            'status': 'idle',
            'fuel_capacity': Decimal(str(random.choice([40, 60, 80, 100]))),
        })
    print('  Seeded 10 vehicles')


def seed_drivers():
    table = db.Table('Drivers')
    print('Seeding Drivers...')
    for i in range(1, 11):
        table.put_item(Item={
            'driver_id': f'driver-{i}',
            'name': DRIVER_NAMES[i - 1],
            'phone': f'+9194{random.randint(10000000, 99999999)}',
            'license': f'TN{random.randint(100000, 999999)}',
            'safety_score': Decimal(str(round(random.uniform(60, 100), 1))),
            'total_trips': random.randint(10, 100),
        })
    print('  Seeded 10 drivers')


def seed_alerts():
    table = db.Table('Alerts')
    print('Seeding Alerts...')
    alert_types = ['OVERSPEEDING', 'FUEL_THEFT', 'ROUTE_DEVIATION']
    for i in range(1, 4):
        table.put_item(Item={
            'alert_id': str(uuid.uuid4()),
            'vehicle_id': f'vehicle-{i}',
            'driver_id': f'driver-{i}',
            'alert_type': random.choice(alert_types),
            'severity': random.choice(['low', 'medium', 'high']),
            'timestamp': (datetime.utcnow() - timedelta(minutes=random.randint(1, 60))).isoformat(),
            'resolved': False,
            'message': 'Seeded demo alert',
        })
    print('  Seeded 3 alerts')


def seed_tasks():
    table = db.Table('Tasks')
    print('Seeding Tasks...')
    now = datetime.utcnow().isoformat()
    for t in PRE_SEEDED_TASKS:
        table.put_item(Item={
            **t,
            'created_at': now,
            'assigned_at': now,
            'start_coords': [Decimal(str(c)) for c in t['start_coords']],
            'end_coords': [Decimal(str(c)) for c in t['end_coords']],
        })
    print(f'  Seeded {len(PRE_SEEDED_TASKS)} tasks')


if __name__ == '__main__':
    seed_vehicles()
    seed_drivers()
    seed_alerts()
    seed_tasks()
    print('\nDone.')