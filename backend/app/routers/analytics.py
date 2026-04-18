# backend/app/routers/analytics.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services import analytics_service

router = APIRouter()


@router.get("/fuel")
def fuel_analytics(user=Depends(get_current_user)):
    return analytics_service.get_fuel_analytics()


@router.get("/trips")
def trip_analytics(user=Depends(get_current_user)):
    return analytics_service.get_trip_analytics()


@router.get("/drivers")
def driver_analytics(user=Depends(get_current_user)):
    return analytics_service.get_driver_analytics()


@router.get("/alerts")
def alert_breakdown(user=Depends(get_current_user)):
    return analytics_service.get_alert_breakdown()


@router.get("/summary")
def fleet_summary(user=Depends(get_current_user)):
    return analytics_service.get_fleet_summary()
