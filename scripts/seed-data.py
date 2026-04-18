#!/usr/bin/env python3
"""
Seed initial vehicle and driver data to DynamoDB and Redis
Run this after docker-compose up to populate the system with test data
"""
import os
import json
import uuid
import boto3
import redis
from datetime import datetime

# Configuration
LOCALSTACK_ENDPOINT = os.environ.get('LOCALSTACK_ENDPOINT', 'http://127.0.0.1:4566')
REDIS_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6380/0')
REGION = 'ap-south-1'

# Initialize clients
dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url=LOCALSTACK_ENDPOINT,
    region_name=REGION,
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Vehicle data
VEHICLES = [
    {'id': 'vehicle-1', 'registration': 'TN01AB1001', 'type': 'Truck', 'driver': 'driver-1', 'fuel_capacity': 100},
    {'id': 'vehicle-2', 'registration': 'TN01AB1002', 'type': 'Van', 'driver': 'driver-2', 'fuel_capacity': 80},
    {'id': 'vehicle-3', 'registration': 'TN01AB1003', 'type': 'Truck', 'driver': 'driver-3', 'fuel_capacity': 100},
    {'id': 'vehicle-4', 'registration': 'TN01AB1004', 'type': 'Van', 'driver': 'driver-4', 'fuel_capacity': 80},
    {'id': 'vehicle-5', 'registration': 'TN01AB1005', 'type': 'Truck', 'driver': 'driver-5', 'fuel_capacity': 100},
    {'id': 'vehicle-6', 'registration': 'TN01AB1006', 'type': 'Van', 'driver': 'driver-6', 'fuel_capacity': 80},
    {'id': 'vehicle-7', 'registration': 'TN01AB1007', 'type': 'Truck', 'driver': 'driver-7', 'fuel_capacity': 100},
    {'id': 'vehicle-8', 'registration': 'TN01AB1008', 'type': 'Van', 'driver': 'driver-8', 'fuel_capacity': 80},
    {'id': 'vehicle-9', 'registration': 'TN01AB1009', 'type': 'Truck', 'driver': 'driver-9', 'fuel_capacity': 100},
    {'id': 'vehicle-10', 'registration': 'TN01AB1010', 'type': 'Van', 'driver': 'driver-10', 'fuel_capacity': 80},
]

LOCATIONS = [
    (11.0168, 76.9558, 'Gandhipuram Bus Stand', 'Coimbatore Airport'),
    (10.9987, 76.9508, 'RS Puram', 'Peelamedu'),
    (10.9847, 76.9762, 'Ukkadam', 'Singanallur'),
    (11.0130, 77.0180, 'Tidel Park', 'Podanur Junction'),
    (11.0080, 76.9720, 'Saibaba Colony', 'Ganapathy'),
    (11.0050, 76.9650, 'Race Course', 'Vadavalli'),
    (11.0200, 76.9600, 'Hopes College', 'Kuniyamuthur'),
    (10.9500, 76.9650, 'Kovaipudur', 'Thondamuthur'),
    (11.0330, 77.1200, 'Sulur', 'Kaniyur'),
    (11.0400, 76.9700, 'Mettupalayam Road', 'Avinashi Road'),
]

def seed_vehicles():
    """Seed vehicles to DynamoDB"""
    table = dynamodb.Table('Vehicles')
    print("📦 Seeding vehicles to DynamoDB...")
    
    for i, vehicle in enumerate(VEHICLES):
        lat, lon, src, dst = LOCATIONS[i]
        item = {
            'vehicle_id': vehicle['id'],
            'registration': vehicle['registration'],
            'type': vehicle['type'],
            'driver_id': vehicle['driver'],
            'fuel_capacity': vehicle['fuel_capacity'],
            'latitude': lat,
            'longitude': lon,
            'speed': 0,
            'fuel_level': 75,
            'status': 'idle',
            'last_updated': datetime.utcnow().isoformat(),
        }
        table.put_item(Item=item)
        print(f"  ✅ {vehicle['id']}")
    
    print(f"✅ Seeded {len(VEHICLES)} vehicles")

def seed_drivers():
    """Seed drivers to DynamoDB"""
    table = dynamodb.Table('Drivers')
    print("👨‍💼 Seeding drivers to DynamoDB...")
    
    for i in range(1, 11):
        item = {
            'driver_id': f'driver-{i}',
            'name': f'Driver {i}',
            'phone': f'9876543{i:03d}',
            'email': f'driver{i}@fleetpulse.com',
            'status': 'active',
            'license_number': f'TN{i:08d}',
            'created_at': datetime.utcnow().isoformat(),
        }
        table.put_item(Item=item)
        print(f"  ✅ driver-{i}")
    
    print(f"✅ Seeded 10 drivers")

def seed_redis_locations():
    """Seed vehicle locations to Redis for real-time tracking"""
    print("📍 Seeding vehicle locations to Redis...")
    
    for i, vehicle in enumerate(VEHICLES):
        lat, lon, src, dst = LOCATIONS[i]
        key = f'vehicle:{vehicle["id"]}:location'
        data = {
            'latitude': lat,
            'longitude': lon,
            'speed': 0,
            'fuel_level': 75,
            'status': 'idle',
            'timestamp': datetime.utcnow().isoformat(),
            'source': src,
            'dest': dst,
            'progress': 0,
            'odometer': 0,
            'driver_fatigue': 0,
        }
        redis_client.set(key, json.dumps(data))
        print(f"  ✅ {vehicle['id']}")
    
    print(f"✅ Seeded {len(VEHICLES)} vehicle locations to Redis")

def main():
    print("\n🚀 FleetPulse Data Seeding\n")
    
    try:
        seed_vehicles()
        print()
        seed_drivers()
        print()
        seed_redis_locations()
        print("\n✅ All data seeded successfully!\n")
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
