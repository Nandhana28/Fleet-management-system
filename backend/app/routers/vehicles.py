# backend/app/routers/vehicles.py
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.db import queries
from shared.exceptions import VehicleNotFoundError

router = APIRouter()


@router.get("")
def list_vehicles(user=Depends(get_current_user)):
    return queries.get_all_vehicles()


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: str, user=Depends(get_current_user)):
    vehicle = queries.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return vehicle


@router.get("/{vehicle_id}/trips")
def get_vehicle_trips(vehicle_id: str, limit: int = 50, user=Depends(get_current_user)):
    vehicle = queries.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return queries.get_trips_for_vehicle(vehicle_id, limit=limit)
