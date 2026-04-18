# backend/app/services/analytics_service.py
import json
from app.db import queries


def _redis():
    try:
        import os, redis as redis_lib
        url = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
        r = redis_lib.from_url(url, decode_responses=True)
        r.ping()
        return r
    except Exception:
        return None


def _live_locations() -> dict:
    """Return {vehicle_id: location_dict} for all vehicles from Redis."""
    r = _redis()
    if not r:
        return {}
    result = {}
    for i in range(1, 11):
        vid = f'vehicle-{i}'
        raw = r.get(f'vehicle:{vid}:location')
        if raw:
            try:
                result[vid] = json.loads(raw)
            except Exception:
                pass
    return result


def get_fuel_analytics() -> list:
    """Returns current live fuel level per vehicle (Redis) + historical readings."""
    vehicles = queries.get_all_vehicles()
    live = _live_locations()
    result = []
    for v in vehicles:
        vid = v.get('vehicle_id')
        trips = queries.get_trips_for_vehicle(vid, limit=50)
        fuel_readings = [
            {'timestamp': t.get('timestamp'), 'fuel_level': t.get('fuel_level')}
            for t in trips if t.get('fuel_level') is not None
        ]
        loc = live.get(vid, {})
        live_fuel = loc.get('fuel_level')
        result.append({
            'vehicle_id': vid,
            'registration': v.get('registration'),
            'fuel_readings': fuel_readings,
            'current_fuel': float(live_fuel) if live_fuel is not None else None,
            'current_status': loc.get('status', 'unknown'),
            'current_speed': loc.get('speed'),
        })
    return result


def get_trip_analytics() -> list:
    """Returns trip count and total distance per vehicle."""
    vehicles = queries.get_all_vehicles()
    result = []
    for v in vehicles:
        vid = v.get('vehicle_id')
        trips = queries.get_trips_for_vehicle(vid, limit=100)
        total_dist = sum(float(t.get('distance_km') or 0) for t in trips)
        result.append({
            'vehicle_id': vid,
            'registration': v.get('registration'),
            'trip_count': len(trips),
            'total_distance_km': round(total_dist, 1),
        })
    return sorted(result, key=lambda x: x['trip_count'], reverse=True)


def get_driver_analytics() -> list:
    """Returns driver leaderboard sorted by score."""
    drivers = queries.get_all_drivers()
    alerts = queries.get_all_alerts(active_only=False)

    alert_counts: dict = {}
    alert_types: dict = {}
    for a in alerts:
        did = a.get('driver_id')
        if not did:
            continue
        alert_counts[did] = alert_counts.get(did, 0) + 1
        atype = a.get('alert_type', 'OTHER')
        if did not in alert_types:
            alert_types[did] = {}
        alert_types[did][atype] = alert_types[did].get(atype, 0) + 1

    result = []
    for d in drivers:
        did = d.get('driver_id')
        result.append({
            'driver_id': did,
            'name': d.get('name'),
            'score': float(d.get('safety_score', d.get('score', 0)) or 0),
            'alerts_fired': alert_counts.get(did, 0),
            'alert_types': alert_types.get(did, {}),
        })
    return sorted(result, key=lambda x: x['score'], reverse=True)


def get_alert_breakdown() -> dict:
    """Returns alert counts grouped by type and severity."""
    alerts = queries.get_all_alerts(active_only=False)
    by_type: dict = {}
    by_severity: dict = {}
    by_vehicle: dict = {}
    for a in alerts:
        atype = a.get('alert_type', 'OTHER')
        sev   = a.get('severity', 'medium')
        vid   = a.get('vehicle_id', 'unknown')
        by_type[atype]     = by_type.get(atype, 0) + 1
        by_severity[sev]   = by_severity.get(sev, 0) + 1
        by_vehicle[vid]    = by_vehicle.get(vid, 0) + 1
    return {
        'by_type': by_type,
        'by_severity': by_severity,
        'by_vehicle': by_vehicle,
        'total': len(alerts),
    }


def get_fleet_summary() -> dict:
    """Fleet-wide summary using live Redis data + DynamoDB."""
    live = _live_locations()
    vehicles = queries.get_all_vehicles()
    drivers  = queries.get_all_drivers()
    alerts   = queries.get_all_alerts(active_only=True)

    statuses = [loc.get('status', 'unknown') for loc in live.values()]
    fuels    = [float(loc['fuel_level']) for loc in live.values() if loc.get('fuel_level') is not None]
    speeds   = [float(loc['speed']) for loc in live.values() if loc.get('speed') and float(loc['speed']) > 0]
    scores   = [float(d.get('safety_score', d.get('score', 0)) or 0) for d in drivers]

    return {
        'total_vehicles': len(vehicles),
        'moving': statuses.count('moving'),
        'idle':   statuses.count('idle'),
        'offline': len(vehicles) - len(live),
        'active_alerts': len(alerts),
        'avg_fuel': round(sum(fuels) / len(fuels), 1) if fuels else 0,
        'min_fuel': round(min(fuels), 1) if fuels else 0,
        'avg_speed': round(sum(speeds) / len(speeds), 1) if speeds else 0,
        'avg_driver_score': round(sum(scores) / len(scores), 1) if scores else 0,
        'total_drivers': len(drivers),
    }
