# backend/app/services/analytics_service.py
from app.db import queries


def get_fuel_analytics() -> list:
    """Returns trip data per vehicle for fuel chart."""
    vehicles = queries.get_all_vehicles()
    result = []
    for v in vehicles:
        vid = v.get("vehicle_id")
        trips = queries.get_trips_for_vehicle(vid, limit=100)
        fuel_readings = [
            {
                "timestamp": t.get("timestamp"),
                "fuel_level": t.get("fuel_level"),
            }
            for t in trips if t.get("fuel_level") is not None
        ]
        result.append({
            "vehicle_id": vid,
            "registration": v.get("registration"),
            "fuel_readings": fuel_readings,
        })
    return result


def get_trip_analytics() -> list:
    """Returns trip count and total distance per vehicle."""
    vehicles = queries.get_all_vehicles()
    result = []
    for v in vehicles:
        vid = v.get("vehicle_id")
        trips = queries.get_trips_for_vehicle(vid, limit=100)
        result.append({
            "vehicle_id": vid,
            "registration": v.get("registration"),
            "trip_count": len(trips),
        })
    return sorted(result, key=lambda x: x["trip_count"], reverse=True)


def get_driver_analytics() -> list:
    """Returns driver leaderboard sorted by score."""
    drivers = queries.get_all_drivers()
    alerts = queries.get_all_alerts(active_only=False)

    alert_counts = {}
    for a in alerts:
        did = a.get("driver_id")
        alert_counts[did] = alert_counts.get(did, 0) + 1

    result = []
    for d in drivers:
        did = d.get("driver_id")
        result.append({
            "driver_id": did,
            "name": d.get("name"),
            "score": d.get("score"),
            "alerts_fired": alert_counts.get(did, 0),
        })

    return sorted(result, key=lambda x: x["score"], reverse=True)