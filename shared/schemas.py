from pydantic import BaseModel
from typing import Optional

# from datetime import datetime


class GPSPayload(BaseModel):
    vehicle_id: str
    driver_id: str
    latitude: float
    longitude: float
    speed: float
    fuel_level: float
    timestamp: str
    status: str = "moving"


class Vehicle(BaseModel):
    vehicle_id: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    speed: Optional[str] = None
    fuel_level: Optional[str] = None
    status: Optional[str] = None
    last_updated: Optional[str] = None


class TripRecord(BaseModel):
    trip_id: str
    vehicle_id: str
    driver_id: str
    latitude: str
    longitude: str
    speed: str
    fuel_level: str
    timestamp: str
    status: str


class Alert(BaseModel):
    alert_id: str
    vehicle_id: str
    driver_id: str
    anomaly_type: str
    details: str
    severity: str
    latitude: str
    longitude: str
    timestamp: str
    status: str = "UNRESOLVED"
