import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import boto3
from botocore.config import Config
from boto3.dynamodb.conditions import Key
from ..config import settings

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

def get_table():
    endpoint = settings.localstack_endpoint if settings.use_localstack else None
    dynamodb = boto3.resource(
        "dynamodb",
        endpoint_url=endpoint,
        region_name="ap-south-1",
        aws_access_key_id="test" if settings.use_localstack else None,
        aws_secret_access_key="test" if settings.use_localstack else None,
        config=Config(retries={"max_attempts": 1}, connect_timeout=3, read_timeout=3),
    )
    return dynamodb.Table("Maintenance")

class MaintenanceCreate(BaseModel):
    vehicle_id: str
    vehicle_name: str
    service_type: str
    date: str
    cost: float
    odometer_at_service: int
    next_due_km: Optional[int] = None
    next_due_date: Optional[str] = None
    notes: Optional[str] = ""

class MaintenanceUpdate(BaseModel):
    service_type: Optional[str] = None
    date: Optional[str] = None
    cost: Optional[float] = None
    odometer_at_service: Optional[int] = None
    next_due_km: Optional[int] = None
    next_due_date: Optional[str] = None
    notes: Optional[str] = None

@router.get("")
async def list_maintenance(vehicle_id: Optional[str] = Query(None)):
    table = get_table()
    if vehicle_id:
        resp = table.query(
            IndexName="vehicle-index",
            KeyConditionExpression=Key("vehicle_id").eq(vehicle_id),
        )
    else:
        resp = table.scan()
    records = resp.get("Items", [])
    records.sort(key=lambda x: x.get("date", ""), reverse=True)
    return {"records": records, "count": len(records)}

@router.post("", status_code=201)
async def create_maintenance(body: MaintenanceCreate):
    table = get_table()
    maintenance_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "maintenance_id": maintenance_id,
        "created_at": now,
        **body.model_dump(),
    }
    item["cost"] = Decimal(str(item["cost"]))
    table.put_item(Item=item)
    return {"maintenance_id": maintenance_id, "message": "Maintenance record saved"}

@router.get("/due")
async def get_due_maintenance(current_km: Optional[int] = Query(None)):
    table = get_table()
    resp = table.scan()
    records = resp.get("Items", [])
    due = []
    today = datetime.now(timezone.utc).date()
    for r in records:
        reasons = []
        if r.get("next_due_date"):
            due_date = datetime.fromisoformat(r["next_due_date"]).date()
            days_left = (due_date - today).days
            if days_left <= 30:
                reasons.append(f"Due in {days_left} days" if days_left >= 0 else f"Overdue by {-days_left} days")
        if current_km and r.get("next_due_km"):
            km_left = int(r["next_due_km"]) - current_km
            if km_left <= 500:
                reasons.append(f"{km_left} km remaining" if km_left >= 0 else f"Overdue by {-km_left} km")
        if reasons:
            due.append({**r, "due_reasons": reasons})
    return {"due_records": due, "count": len(due)}

@router.get("/{maintenance_id}")
async def get_maintenance(maintenance_id: str):
    table = get_table()
    resp = table.get_item(Key={"maintenance_id": maintenance_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Record not found")
    return item

@router.patch("/{maintenance_id}")
async def update_maintenance(maintenance_id: str, body: MaintenanceUpdate):
    table = get_table()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "cost" in updates:
        updates["cost"] = Decimal(str(updates["cost"]))
    expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates)
    names = {f"#{k}": k for k in updates}
    values = {f":{k}": v for k, v in updates.items()}
    table.update_item(
        Key={"maintenance_id": maintenance_id},
        UpdateExpression=expr,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
    )
    return {"message": "Updated"}

@router.delete("/{maintenance_id}", status_code=204)
async def delete_maintenance(maintenance_id: str):
    table = get_table()
    table.delete_item(Key={"maintenance_id": maintenance_id})