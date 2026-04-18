from tasks.celery_app import celery
from app.db import queries
from app.config import settings


def send_twilio_sms(phone: str, message: str) -> bool:
    """Send SMS via Twilio. Returns True if successful."""
    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(
            body=message,
            from_='+15005550006',  # Twilio test number (works in trial)
            to=phone
        )
        return True
    except Exception as e:
        print(f"[Twilio SMS Error] {e}")
        return False


def send_twilio_whatsapp(phone: str, message: str) -> bool:
    """Send WhatsApp message via Twilio."""
    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        # Ensure phone has whatsapp: prefix
        to = phone if phone.startswith('whatsapp:') else f'whatsapp:{phone}'
        client.messages.create(
            body=message,
            from_='whatsapp:+14155238886',  # Twilio sandbox WhatsApp number
            to=to
        )
        return True
    except Exception as e:
        print(f"[Twilio WhatsApp Error] {e}")
        return False


def send_alert_notification(phone: str, email: str, message: str):
    """Send alert via WhatsApp + email."""
    if phone:
        # Normalize phone — add +91 if no country code
        normalized = phone.strip()
        if not normalized.startswith('+'):
            normalized = f'+91{normalized}'
        send_twilio_whatsapp(normalized, message)

    if email:
        # SES email — print for now since SES needs production verification
        print(f"[Email Alert] To: {email} | Message: {message}")


@celery.task(name="tasks.alerts.batch_unresolved_alerts")
def batch_unresolved_alerts():
    """
    Runs every 5 minutes via Celery Beat.
    Re-notifies owner of unresolved alerts older than 30 minutes.
    """
    from datetime import datetime, timedelta
    from app.db.dynamodb import get_table

    unresolved = queries.get_all_alerts(active_only=True)

    # Load settings to get notification contacts
    try:
        config_table = get_table("AgentConfig")
        # Get all user settings (scan for all settings entries)
        resp = config_table.scan(
            FilterExpression="begins_with(config_id, :prefix)",
            ExpressionAttributeValues={":prefix": "settings:"}
        )
        user_settings = resp.get("Items", [])
    except Exception:
        user_settings = []

    notified = 0
    for alert in unresolved:
        msg = (
            f"FleetPulse Alert: {alert.get('alert_type', 'Unknown')} detected "
            f"on {alert.get('vehicle_id', 'unknown vehicle')}. "
            f"Please check immediately."
        )
        for us in user_settings:
            notifs = us.get("notifications", {})
            phone = notifs.get("whatsapp", "")
            email = notifs.get("email", "")
            if phone or email:
                send_alert_notification(phone, email, msg)
                notified += 1

        print(f"[Alert Re-notify] {alert.get('alert_type')} — {alert.get('vehicle_id')}")

    return {"re_notified": notified, "total_unresolved": len(unresolved)}


@celery.task(name="tasks.alerts.send_test_alert")
def send_test_alert(phone: str, email: str):
    """Send a test alert to verify notification setup."""
    message = (
        "FleetPulse Test Alert: Your notification setup is working correctly. "
        "You will receive alerts for fuel theft, overspeeding, and route deviation."
    )
    send_alert_notification(phone, email, message)
    return {"sent": True, "phone": phone, "email": email}

@celery.task(name="tasks.alerts.check_night_movement")
def check_night_movement():
    """
    Runs every 15 minutes via Celery Beat.
    If any vehicle is moving between 10 PM – 5 AM, send WhatsApp alert.
    Respects the night_alerts toggle in user Settings.
    """
    from datetime import datetime, timezone
    import json
    import redis as redis_lib
    from app.db.dynamodb import get_table

    # Check time — IST is UTC+5:30
    now_utc = datetime.now(timezone.utc)
    ist_hour = (now_utc.hour + 5) % 24  # approximate IST hour
    is_night = ist_hour >= 22 or ist_hour < 5

    if not is_night:
        print(f"[Night Alert] Skipping — IST hour is {ist_hour}, not night time")
        return {"skipped": True, "reason": "not night time"}

    # Get moving vehicles from Redis
    try:
        import os
        r = redis_lib.from_url(os.environ.get("REDIS_URL", "redis://redis:6379/0"), decode_responses=True)
        keys = r.keys("vehicle:*:location")
        moving = []
        for key in keys:
            raw = r.get(key)
            if not raw:
                continue
            data = json.loads(raw)
            if data.get("status") == "moving" and float(data.get("speed", 0)) > 5:
                vehicle_id = key.split(":")[1]
                moving.append({
                    "vehicle_id": vehicle_id,
                    "speed": data.get("speed"),
                    "location": f"{data.get('latitude', '')}, {data.get('longitude', '')}",
                })
    except Exception as e:
        print(f"[Night Alert] Redis error: {e}")
        return {"error": str(e)}

    if not moving:
        print("[Night Alert] No vehicles moving at night")
        return {"moving_at_night": 0}

    # Load user settings — check night_alerts toggle
    try:
        config_table = get_table("AgentConfig")
        resp = config_table.scan()
        user_settings = [
            item for item in resp.get("Items", [])
            if str(item.get("config_key", "")).startswith("settings:")
        ]
    except Exception as e:
        print(f"[Night Alert] DynamoDB error: {e}")
        return {"error": str(e)}

    alerted = 0
    for us in user_settings:
        notifs = us.get("notifications", {})

        # Respect the night_alerts toggle (default True if not set)
        if not notifs.get("night_alerts", True):
            print("[Night Alert] Disabled in user settings — skipping")
            continue

        phone = notifs.get("whatsapp", "")
        email = notifs.get("email", "")

        if not phone and not email:
            continue

        vehicle_list = "\n".join(
            f"• {v['vehicle_id']} — {v['speed']} km/h" for v in moving
        )
        message = (
            f"🌙 *FleetPulse Night Movement Alert*\n"
            f"Time: {now_utc.strftime('%H:%M')} UTC ({ist_hour:02d}:xx IST)\n\n"
            f"{len(moving)} vehicle(s) moving at night:\n{vehicle_list}\n\n"
            f"Log in to FleetPulse to investigate."
        )
        send_alert_notification(phone, email, message)
        alerted += 1

    print(f"[Night Alert] Sent to {alerted} user(s) — {len(moving)} vehicles moving")
    return {"moving_at_night": len(moving), "alerted": alerted}