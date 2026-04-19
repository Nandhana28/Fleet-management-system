# backend/app/routers/fuel.py
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.db import queries
import redis
import json
import os

router = APIRouter(prefix="/fuel", tags=["fuel"])

redis_url = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/0')
redis_client = redis.from_url(redis_url, decode_responses=True)


@router.get("/vehicles/{vehicle_id}/history")
def get_fuel_history(vehicle_id: str, user=Depends(get_current_user), limit: int = 100):
    """Get fuel consumption history for a vehicle"""
    try:
        # Get vehicle to verify it exists
        vehicle = queries.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        # Get fuel history from Redis cache (recent) + DynamoDB (historical)
        fuel_events = queries.get_fuel_history(vehicle_id, limit=limit)

        return {
            "vehicle_id": vehicle_id,
            "fuel_events": fuel_events or [],
            "total_events": len(fuel_events) if fuel_events else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vehicles/{vehicle_id}/refills")
def get_refuel_events(vehicle_id: str, user=Depends(get_current_user)):
    """Get refuel events for a vehicle"""
    try:
        vehicle = queries.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        # Query Alerts table for FUEL_REFILL alerts
        refill_alerts = queries.get_alerts_by_type(vehicle_id, 'FUEL_REFILL')

        return {
            "vehicle_id": vehicle_id,
            "refills": refill_alerts or [],
            "total_refills": len(refill_alerts) if refill_alerts else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vehicles/{vehicle_id}/consumption")
def get_fuel_consumption_stats(vehicle_id: str, user=Depends(get_current_user)):
    """Get fuel consumption statistics"""
    try:
        vehicle = queries.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        # Get current fuel level
        location = redis_client.get(f"vehicle:{vehicle_id}:location")
        current_fuel = 0
        if location:
            location_data = json.loads(location)
            current_fuel = location_data.get('fuel_level', 0)

        # Get fuel history for consumption calculation
        fuel_history = queries.get_fuel_history(vehicle_id, limit=50)

        avg_consumption = 0
        total_refills = 0
        if fuel_history and len(fuel_history) > 1:
            # Calculate average consumption per trip
            total_consumed = 0
            for i in range(len(fuel_history) - 1):
                diff = fuel_history[i].get('fuel_level', 0) - fuel_history[i + 1].get('fuel_level', 0)
                if diff > 0:
                    total_consumed += diff
            avg_consumption = total_consumed / (len(fuel_history) - 1) if len(fuel_history) > 1 else 0

        refills = queries.get_alerts_by_type(vehicle_id, 'FUEL_REFILL')
        total_refills = len(refills) if refills else 0

        return {
            "vehicle_id": vehicle_id,
            "current_fuel_level": round(current_fuel, 1),
            "avg_consumption_per_trip": round(avg_consumption, 2),
            "total_refills": total_refills,
            "low_fuel_threshold": 25
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
