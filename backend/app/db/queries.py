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
    # Tasks table holds all trips (active + completed); Trips table is unused
    table = get_table('Tasks')
    response = table.scan(
        FilterExpression=Attr("vehicle_id").eq(vehicle_id),
    )
    items = response.get("Items", [])
    # Sort newest first
    items.sort(key=lambda x: x.get("created_at", x.get("timestamp", "")), reverse=True)
    return items[:limit]


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
        # Match alerts where resolved is False OR resolved attribute is missing entirely
        response = table.scan(
            FilterExpression=Attr("resolved").eq(False) | Attr("resolved").not_exists()
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
    from datetime import datetime
    response = table.update_item(
        Key={ALERT_PK: alert_id},
        UpdateExpression="SET resolved = :r, #s = :s, resolved_at = :t",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":r": True,
            ":s": "resolved",
            ":t": datetime.utcnow().isoformat(),
        },
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


# ─── Users ────────────────────────────────────────────────────────────────────

def get_user_by_id(user_id: str) -> dict | None:
    table = get_table('Users')
    response = table.get_item(Key={'user_id': user_id})
    return response.get("Item")


def update_user(user_id: str, updates: dict) -> dict | None:
    if not updates:
        return get_user_by_id(user_id)
    table = get_table('Users')
    expr = "SET " + ", ".join(f"#f{i} = :v{i}" for i in range(len(updates)))
    names = {f"#f{i}": k for i, k in enumerate(updates)}
    values = {f":v{i}": v for i, v in enumerate(updates.values())}
    resp = table.update_item(
        Key={'user_id': user_id},
        UpdateExpression=expr,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
        ReturnValues="ALL_NEW",
    )
    return resp.get("Attributes")


def get_user_activity(user_id: str, limit: int = 50) -> list:
    try:
        table = get_table('ActivityLog')
        resp = table.scan(FilterExpression=Attr("user_id").eq(user_id))
        items = resp.get("Items", [])
        items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return items[:limit]
    except Exception:
        return []


def create_activity_log(activity: dict) -> None:
    try:
        table = get_table('ActivityLog')
        if "activity_id" not in activity:
            activity["activity_id"] = str(uuid.uuid4())
        table.put_item(Item=activity)
    except Exception:
        pass
