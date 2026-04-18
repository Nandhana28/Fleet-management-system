# backend/app/services/vehicle_service.py
from app.db import queries
from app.services.cache_service import get_vehicle_location, get_all_vehicle_locations


def get_all_vehicles_with_location() -> list:
    """
    Gets all vehicles from DynamoDB and merges
    current location from Redis for each one.
    Redis status only overrides DynamoDB for SOS.
    """
    vehicles = queries.get_all_vehicles()
    locations = get_all_vehicle_locations()

    for vehicle in vehicles:
        vid = vehicle.get("vehicle_id")
        if vid in locations:
            vehicle["current_location"] = locations[vid]
            # Only SOS overrides DynamoDB status
            if locations[vid].get("status") == "sos":
                vehicle["status"] = "sos"
        else:
            vehicle["current_location"] = None

    return vehicles


def get_vehicle_with_location(vehicle_id: str) -> dict | None:
    """
    Gets single vehicle from DynamoDB and merges
    current location from Redis.
    Redis status only overrides DynamoDB for SOS.
    """
    vehicle = queries.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        return None

    location = get_vehicle_location(vehicle_id)
    vehicle["current_location"] = location
    if location and location.get("status") == "sos":
        vehicle["status"] = "sos"
    return vehicle