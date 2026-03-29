# backend/app/db/queries.py
# All DynamoDB operations — no raw boto3 calls in routers, only here.

import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr
from app.db.dynamodb import get_table
from shared.constants import (
    VEHICLES_TABLE, TRIPS_TABLE, ALERTS_TABLE,
    DRIVERS_TABLE, VEHICLE_PK, TRIP_PK, ALERT_PK, DRIVER_PK
)

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# ─── Vehicles ─────────────────────────────────────────────────────────────────

def get_all_vehicles() -> list:
    table = get_table(VEHICLES_TABLE)
    response = table.scan()
    return response.get("Items", [])


def get_vehicle_by_id(vehicle_id: str) -> dict | None:
    table = get_table(VEHICLES_TABLE)
    response = table.get_item(Key={VEHICLE_PK: vehicle_id})
    return response.get("Item")


def put_vehicle(vehicle: dict) -> dict:
    table = get_table(VEHICLES_TABLE)
    table.put_item(Item=vehicle)
    return vehicle


# ─── Trips ────────────────────────────────────────────────────────────────────

def get_trips_for_vehicle(vehicle_id: str, limit: int = 50) -> list:
    table = get_table(TRIPS_TABLE)
    response = table.scan(
        FilterExpression=Attr("vehicle_id").eq(vehicle_id),
        Limit=limit,
    )
    return response.get("Items", [])


def put_trip(trip: dict) -> dict:
    table = get_table(TRIPS_TABLE)
    if "trip_id" not in trip:
        trip["trip_id"] = str(uuid.uuid4())
    if "timestamp" not in trip:
        trip["timestamp"] = datetime.utcnow().isoformat()
    table.put_item(Item=trip)
    return trip


# ─── Alerts ───────────────────────────────────────────────────────────────────

def get_all_alerts(active_only: bool = True) -> list:
    table = get_table(ALERTS_TABLE)
    if active_only:
        response = table.scan(
            FilterExpression=Attr("resolved").eq(False)
        )
    else:
        response = table.scan()
    return response.get("Items", [])


def get_alert_by_id(alert_id: str) -> dict | None:
    table = get_table(ALERTS_TABLE)
    response = table.get_item(Key={ALERT_PK: alert_id})
    return response.get("Item")


def resolve_alert(alert_id: str) -> dict | None:
    table = get_table(ALERTS_TABLE)
    response = table.update_item(
        Key={ALERT_PK: alert_id},
        UpdateExpression="SET resolved = :r",
        ExpressionAttributeValues={":r": True},
        ReturnValues="ALL_NEW",
    )
    return response.get("Attributes")


# ─── Drivers ──────────────────────────────────────────────────────────────────

def get_all_drivers() -> list:
    table = get_table(DRIVERS_TABLE)
    response = table.scan()
    return response.get("Items", [])


def get_driver_by_id(driver_id: str) -> dict | None:
    table = get_table(DRIVERS_TABLE)
    response = table.get_item(Key={DRIVER_PK: driver_id})
    return response.get("Item")
