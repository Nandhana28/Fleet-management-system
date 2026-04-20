# backend/app/routers/vehicles.py
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.services import vehicle_service
from app.db import queries
from app.metrics import vehicles_total, dynamodb_query_duration
import time

router = APIRouter()


@router.get("")
def list_vehicles(user=Depends(get_current_user)):
    start = time.time()
    vehicles = vehicle_service.get_all_vehicles_with_location()
    duration = time.time() - start
    
    # Record metrics (wrapped in try-except to prevent crashes)
    try:
        vehicles_total.set(len(vehicles))
        dynamodb_query_duration.labels(operation='query').observe(duration)
    except Exception as e:
        print(f"[Metrics] Error recording vehicle metrics: {e}")
    
    return {"vehicles": vehicles}


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: str, user=Depends(get_current_user)):
    start = time.time()
    vehicle = vehicle_service.get_vehicle_with_location(vehicle_id)
    duration = time.time() - start
    
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    
    try:
        dynamodb_query_duration.labels(operation='get_item').observe(duration)
    except Exception as e:
        print(f"[Metrics] Error recording vehicle metric: {e}")
    
    return vehicle


@router.get("/{vehicle_id}/trips")
def get_vehicle_trips(vehicle_id: str, limit: int = 50, user=Depends(get_current_user)):
    start = time.time()
    vehicle = queries.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    
    trips = queries.get_trips_for_vehicle(vehicle_id, limit=limit)
    duration = time.time() - start
    
    try:
        dynamodb_query_duration.labels(operation='query').observe(duration)
    except Exception as e:
        print(f"[Metrics] Error recording trip metrics: {e}")
    
    return trips

@router.get("/{vehicle_id}/route")
async def get_vehicle_route(vehicle_id: str):
    """Return the road waypoints stored by the simulator."""
    import json
    try:
        from app.services.cache_service import client as redis_client
        raw = redis_client.get(f"vehicle:{vehicle_id}:route")
        if not raw:
            return {"waypoints": []}
        data = json.loads(raw)
        return {"waypoints": data.get("waypoints", [])}
    except Exception as e:
        return {"waypoints": [], "error": str(e)}
