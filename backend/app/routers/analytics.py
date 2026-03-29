# backend/app/routers/analytics.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.db import queries

router = APIRouter()


@router.get("/fuel")
def fuel_analytics(user=Depends(get_current_user)):
    # Returns all trips — frontend aggregates by vehicle for chart
    trips = queries.get_all_alerts(active_only=False)
    return {"data": trips, "note": "Full analytics service wired in Week 2"}


@router.get("/trips")
def trip_analytics(user=Depends(get_current_user)):
    vehicles = queries.get_all_vehicles()
    summary = []
    for v in vehicles:
        trips = queries.get_trips_for_vehicle(v.get("vehicle_id", ""), limit=100)
        summary.append({
            "vehicle_id": v.get("vehicle_id"),
            "trip_count": len(trips),
        })
    return {"data": summary}


@router.get("/drivers")
def driver_analytics(user=Depends(get_current_user)):
    drivers = queries.get_all_drivers()
    return {"data": drivers}
