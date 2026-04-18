from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services import alert_service
from app.metrics import active_alerts_total, alerts_total
import time


class ResolveBody(BaseModel):
    action: str = "resume"   # "resume" or "replace"

router = APIRouter()


@router.get("")
def list_alerts(active_only: bool = True, user=Depends(get_current_user)):
    start = time.time()
    if active_only:
        alerts = alert_service.get_active_alerts()
    else:
        alerts = alert_service.get_all_alerts()
    
    duration = time.time() - start
    
    # Record metrics (wrapped in try-except to prevent crashes)
    try:
        active_alerts_total.set(len(alerts))
    except Exception as e:
        print(f"[Metrics] Error recording alert metrics: {e}")
    
    return {"alerts": alerts}


@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    body: Optional[ResolveBody] = None,
    user=Depends(get_current_user)
):
    updated = alert_service.resolve_alert(alert_id)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    action = body.action if body else "resume"
    vehicle_id = updated.get("vehicle_id", "")
    task_route: dict = {}

    if vehicle_id:
        try:
            import os, redis as redis_lib, json
            from datetime import datetime
            redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
            r = redis_lib.from_url(redis_url, decode_responses=True)

            # Always clear SOS lock
            r.delete(f"vehicle:{vehicle_id}:sos_lock")
            print(f"[Resolve] SOS lock cleared for {vehicle_id} (action={action})")

            # Handle location status based on action
            loc_key = f"vehicle:{vehicle_id}:location"
            existing = r.get(loc_key)
            if existing:
                data = json.loads(existing)
                if action == "resume":
                    # Resume journey - turn green and continue moving
                    data["status"] = "moving"
                    data["speed"] = 30  # Resume at moderate speed
                else:
                    # Replace vehicle - stop and return to idle
                    data["status"] = "idle"
                    data["speed"] = 0
                data["timestamp"] = datetime.utcnow().isoformat()
                r.setex(loc_key, 86400, json.dumps(data))

            if action == "replace":
                # Capture route info to return to frontend
                task_raw = r.get(f"task:{vehicle_id}:active")
                if task_raw:
                    td = json.loads(task_raw)
                    task_route = {
                        "source":   td.get("source", ""),
                        "dest":     td.get("dest", ""),
                        "driver_id": td.get("driver_id", ""),
                    }
                # Cancel task in Redis
                r.delete(f"task:{vehicle_id}:active")
                print(f"[Resolve] Task cleared from Redis for {vehicle_id}")
                # Cancel task in DynamoDB
                try:
                    from app.db.dynamodb import get_table
                    tasks_table = get_table("Tasks")
                    scan = tasks_table.scan(
                        FilterExpression="vehicle_id = :vid AND #s = :s",
                        ExpressionAttributeNames={"#s": "status"},
                        ExpressionAttributeValues={":vid": vehicle_id, ":s": "active"},
                    )
                    for task in scan.get("Items", []):
                        tasks_table.update_item(
                            Key={"task_id": task["task_id"]},
                            UpdateExpression="SET #s = :s",
                            ExpressionAttributeNames={"#s": "status"},
                            ExpressionAttributeValues={":s": "cancelled"},
                        )
                        print(f"[Resolve] Task {task['task_id']} cancelled in DynamoDB")
                except Exception as e:
                    print(f"[Resolve] DynamoDB task cancel failed: {e}")

        except Exception as e:
            print(f"[Resolve] Redis operation failed: {e}")

    # WhatsApp notification
    try:
        from app.db.dynamodb import get_table
        from tasks.alerts import send_alert_notification
        table = get_table("AgentConfig")
        resp = table.scan()
        for item in resp.get("Items", []):
            notifs = item.get("notifications", {})
            phone = notifs.get("whatsapp", "")
            email = notifs.get("email", "")
            if phone or email:
                send_alert_notification(
                    phone, email,
                    f"FleetPulse: Alert resolved on {vehicle_id or 'unknown'} "
                    f"— {updated.get('alert_type', 'Alert')} marked as resolved."
                )
                break
    except Exception as e:
        print(f"[Alert] WhatsApp notify failed: {e}")

    return {**updated, "task_route": task_route}


@router.post("/resolve-all")
def resolve_all_alerts(user=Depends(get_current_user)):
    """Bulk-resolve every active alert in one DynamoDB batch write."""
    import os, redis as redis_lib, json
    from datetime import datetime
    from app.db.dynamodb import get_table

    alerts_table = get_table("Alerts")

    # Scan all unresolved alerts — match resolved=False OR resolved missing (simulator alerts)
    from boto3.dynamodb.conditions import Attr as DAttr
    resp = alerts_table.scan(
        FilterExpression=DAttr("resolved").eq(False) | DAttr("resolved").not_exists()
    )
    active = resp.get("Items", [])
    if not active:
        return {"resolved": 0}

    now = datetime.utcnow().isoformat()

    # Batch write — set both resolved=True and status="resolved" for full consistency
    with alerts_table.batch_writer() as batch:
        for alert in active:
            batch.put_item(Item={**alert, "status": "resolved", "resolved": True, "resolved_at": now})

    # Clear SOS locks for any SOS-type alerts
    sos_vehicles = list({a["vehicle_id"] for a in active
                         if a.get("alert_type") == "SOS" and a.get("vehicle_id")})
    if sos_vehicles:
        try:
            redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
            r = redis_lib.from_url(redis_url, decode_responses=True)
            pipe = r.pipeline()
            for vid in sos_vehicles:
                pipe.delete(f"vehicle:{vid}:sos_lock")
                loc = r.get(f"vehicle:{vid}:location")
                if loc:
                    data = json.loads(loc)
                    if data.get("status") == "sos":
                        data.update({"status": "idle", "speed": 0, "timestamp": now})
                        pipe.setex(f"vehicle:{vid}:location", 86400, json.dumps(data))
            pipe.execute()
        except Exception as e:
            print(f"[ResolveAll] Redis pipeline failed: {e}")

    try:
        active_alerts_total.set(0)
    except Exception:
        pass

    return {"resolved": len(active)}


@router.post("/notify")
def notify_alert(alert_id: str, user=Depends(get_current_user)):
    """Manually trigger WhatsApp notification for a specific alert."""
    alert = alert_service.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    try:
        from app.db.dynamodb import get_table
        from tasks.alerts import send_alert_notification
        table = get_table("AgentConfig")
        resp = table.scan()
        sent = False
        for item in resp.get("Items", []):
            notifs = item.get("notifications", {})
            phone = notifs.get("whatsapp", "")
            email = notifs.get("email", "")
            if phone or email:
                msg = (
                    f"FleetPulse Alert!\n"
                    f"Type: {alert.get('alert_type', 'Unknown')}\n"
                    f"Vehicle: {alert.get('vehicle_id', 'Unknown')}\n"
                    f"Severity: {alert.get('severity', 'Unknown')}\n"
                    f"Details: {alert.get('message', '')}"
                )
                send_alert_notification(phone, email, msg)
                sent = True
                break
        return {"message": "Notification sent" if sent else "No contact configured"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sos")
async def emergency_sos(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Emergency SOS — immediately creates a critical alert and sends WhatsApp.
    Body: { vehicle_id, latitude, longitude }
    """
    import uuid
    from datetime import datetime, timezone
    from app.db.dynamodb import get_table
    from tasks.alerts import send_alert_notification

    vehicle_id = body.get("vehicle_id", "unknown")
    lat = body.get("latitude", "")
    lon = body.get("longitude", "")
    now = datetime.now(timezone.utc).isoformat()

    # Save SOS alert to DynamoDB
    alert_id = str(uuid.uuid4())
    try:
        table = get_table("Alerts")
        table.put_item(Item={
            "alert_id": alert_id,
            "vehicle_id": vehicle_id,
            "alert_type": "SOS",
            "severity": "critical",
            "status": "active",
            "resolved": False,      # required for get_all_alerts(active_only=True) filter
            "timestamp": now,
            "latitude": str(lat),
            "longitude": str(lon),
            "message": f"EMERGENCY SOS triggered for {vehicle_id}",
        })
        # Record alert metric
        try:
            alerts_total.labels(type='SOS').inc()
        except Exception as e:
            print(f"[Metrics] Error recording SOS alert metric: {e}")
    except Exception as e:
        print(f"[SOS] DynamoDB write failed: {e}")

    # Freeze vehicle in Redis + set SOS lock
    try:
        import os, redis as redis_lib, json
        redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
        r = redis_lib.from_url(redis_url, decode_responses=True)
        key = f"vehicle:{vehicle_id}:location"
        existing = r.get(key)
        if existing:
            data = json.loads(existing)
            data["status"] = "sos"
            data["speed"] = 0
            r.set(key, json.dumps(data))
        r.set(f"vehicle:{vehicle_id}:sos_lock", "1")
        print(f"[SOS] Vehicle {vehicle_id} frozen and locked in Redis")
    except Exception as e:
        print(f"[SOS] Redis freeze/lock failed: {e}")

    # Send WhatsApp — try user-specific settings, then fall back to any configured number
    try:
        phone = ""
        email = ""

        # 1. Try user's own settings key (settings:{user_id})
        config_table = get_table("AgentConfig")
        try:
            config_resp = config_table.get_item(Key={"config_key": f"settings:{current_user}"})
            config_item = config_resp.get("Item", {})
            notif_settings = config_item.get("notifications", {})
            phone = notif_settings.get("whatsapp", "")
            email = notif_settings.get("email", "")
        except Exception:
            pass

        # 2. Try user's record in Users table
        if not phone and not email:
            try:
                users_table = get_table("Users")
                user_resp = users_table.get_item(Key={"user_id": str(current_user)})
                user_item = user_resp.get("Item", {})
                phone = user_item.get("phone", "")
                email = user_item.get("email", "")
            except Exception:
                pass

        # 3. Scan all AgentConfig entries (same as resolve_alert — most reliable)
        if not phone and not email:
            try:
                resp = config_table.scan()
                for item in resp.get("Items", []):
                    notifs = item.get("notifications", {})
                    phone = notifs.get("whatsapp", "")
                    email = notifs.get("email", "")
                    if phone or email:
                        break
            except Exception:
                pass

        print(f"[SOS] WhatsApp target — phone='{phone}' email='{email}' user_id='{current_user}'")

        if phone or email:
            message = (
                f"EMERGENCY SOS — FleetPulse\n"
                f"Vehicle: {vehicle_id}\n"
                f"Time: {now}\n"
                f"Location: {lat}, {lon}\n"
                f"https://maps.google.com/?q={lat},{lon}\n\n"
                f"Respond immediately!"
            )
            send_alert_notification(phone, email, message)
            # Send confirmation to driver's phone
            try:
                from tasks.alerts import send_twilio_whatsapp
                vehicle_table = get_table("Vehicles")
                v_resp = vehicle_table.get_item(Key={"vehicle_id": vehicle_id})
                vehicle_item = v_resp.get("Item", {})
                driver_id = vehicle_item.get("driver_id", "")
                if driver_id:
                    driver_table = get_table("Drivers")
                    d_resp = driver_table.get_item(Key={"driver_id": driver_id})
                    driver = d_resp.get("Item", {})
                    driver_phone = driver.get("phone", "")
                    if driver_phone:
                        send_twilio_whatsapp(
                            driver_phone,
                            f"FleetPulse: SOS received for {vehicle_id}.\n"
                            f"Help is on the way! Stay calm and stay in the vehicle.\n"
                            f"Your manager has been notified."
                        )
                        print(f"[SOS] Confirmation sent to driver {driver_id} at {driver_phone}")
            except Exception as e:
                print(f"[SOS] Driver confirmation failed: {e}")
    except Exception as e:
        print(f"[SOS] Notification failed: {e}")

    return {"alert_id": alert_id, "status": "sos_triggered", "vehicle_id": vehicle_id}
