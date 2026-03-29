import sys
import os
import uuid
from datetime import datetime, timedelta
import random
import boto3
from decimal import Decimal

LOCALSTACK_ENDPOINT = os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566")
AWS_REGION = "ap-south-1"

db = boto3.resource(
    "dynamodb",
    endpoint_url=LOCALSTACK_ENDPOINT,
    region_name=AWS_REGION,
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

TN_REGISTRATIONS = [
    "TN 33 AB 1234", "TN 33 CD 5678", "TN 33 EF 9012",
    "TN 38 GH 3456", "TN 38 IJ 7890", "TN 11 KL 1111",
    "TN 11 MN 2222", "TN 04 OP 3333", "TN 04 QR 4444", "TN 99 ST 5555"
]

DRIVER_NAMES = [
    "Murugan K", "Selvam R", "Ravi S", "Kannan T", "Balu M",
    "Senthil P", "Arjun V", "Dinesh C", "Mani L", "Kumar N"
]

VEHICLE_TYPES = ["lorry", "van", "bus", "auto"]


def seed_vehicles():
    table = db.Table("Vehicles")
    print("Seeding Vehicles...")
    for i in range(1, 11):
        table.put_item(Item={
            "vehicle_id": f"vehicle-{i}",
            "driver_id": f"driver-{i}",
            "registration": TN_REGISTRATIONS[i - 1],
            "type": random.choice(VEHICLE_TYPES),
            "status": random.choice(["moving", "idle", "offline"]),
            "fuel_capacity": Decimal(str(random.choice([40, 60, 80, 100]))),
        })
    print("  Seeded 10 vehicles")


def seed_drivers():
    table = db.Table("Drivers")
    print("Seeding Drivers...")
    for i in range(1, 11):
        table.put_item(Item={
            "driver_id": f"driver-{i}",
            "name": DRIVER_NAMES[i - 1],
            "phone": f"+9194{random.randint(10000000, 99999999)}",
            "license": f"TN{random.randint(100000, 999999)}",
            "score": Decimal(str(round(random.uniform(60, 100), 1))),
        })
    print("  Seeded 10 drivers")


def seed_alerts():
    table = db.Table("Alerts")
    print("Seeding Alerts...")
    alert_types = ["fuel_theft", "overspeeding", "route_deviation"]
    for i in range(1, 6):
        vehicle_num = random.randint(1, 10)
        table.put_item(Item={
            "alert_id": str(uuid.uuid4()),
            "vehicle_id": f"vehicle-{vehicle_num}",
            "driver_id": f"driver-{vehicle_num}",
            "alert_type": random.choice(alert_types),
            "severity": random.choice(["low", "medium", "high"]),
            "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(1, 60))).isoformat(),
            "resolved": False,
            "details": {"note": "seeded demo alert"},
        })
    print("  Seeded 5 alerts")


if __name__ == "__main__":
    seed_vehicles()
    seed_drivers()
    seed_alerts()
    print("\nDone.")
    