from datetime import datetime, timezone
from typing import Optional
import boto3
from botocore.config import Config
from ..config import settings

# Reuse your existing Twilio WhatsApp sender pattern from tasks/alerts.py
try:
    from twilio.rest import Client as TwilioClient
    twilio_client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
    TWILIO_AVAILABLE = True
except Exception:
    TWILIO_AVAILABLE = False

endpoint = settings.localstack_endpoint if settings.use_localstack else None
dynamodb = boto3.resource(
    "dynamodb",
    endpoint_url=endpoint,
    region_name="ap-south-1",
    aws_access_key_id="test" if settings.use_localstack else None,
    aws_secret_access_key="test" if settings.use_localstack else None,
    config=Config(retries={"max_attempts": 3}),
)
table = dynamodb.Table("Maintenance")


async def check_and_send_due_alerts(phone: Optional[str] = None):
    """
    Scan Maintenance table. Send WhatsApp alert for any record where:
    - next_due_date is within 30 days, OR
    - next_due_km threshold is within 500 km (if current odometer available).
    Called after each new record is saved.
    """
    resp = table.scan()
    records = resp.get("Items", [])
    today = datetime.now(timezone.utc).date()

    for r in records:
        alert_reasons = []

        if r.get("next_due_date"):
            due_date = datetime.fromisoformat(r["next_due_date"]).date()
            days_left = (due_date - today).days
            if days_left <= 30:
                label = f"in {days_left} days" if days_left >= 0 else f"OVERDUE by {-days_left} days"
                alert_reasons.append(f"📅 Date-based: due {label} ({r['next_due_date']})")

        if r.get("next_due_km"):
            # We check if odometer_at_service is recorded; can't know current km without GPS
            # Flag if next_due_km looks imminent based on saved odometer
            next_km = int(r["next_due_km"])
            done_at = int(r.get("odometer_at_service", 0))
            interval = next_km - done_at
            # Alert if interval ≤ 500 km (i.e. service was logged very close to next due)
            if 0 < interval <= 500:
                alert_reasons.append(f"🛣️ Km-based: only {interval} km until next service at {next_km} km")

        if alert_reasons and TWILIO_AVAILABLE:
            _send_whatsapp(r, alert_reasons, phone)


def _send_whatsapp(record: dict, reasons: list, phone: Optional[str] = None):
    """Send a WhatsApp message using the same Twilio sandbox as alerts.py."""
    to_number = phone or getattr(settings, "alert_phone_number", None)
    if not to_number:
        print("⚠️  No phone number configured for maintenance alerts")
        return

    vehicle = record.get("vehicle_name", record.get("vehicle_id", "Unknown"))
    service = record.get("service_type", "Service")
    reason_text = "\n".join(reasons)

    message = (
        f"🔧 *FleetPulse Maintenance Alert*\n"
        f"Vehicle: {vehicle}\n"
        f"Service: {service}\n"
        f"{reason_text}\n"
        f"Log in to FleetPulse to schedule service."
    )

    try:
        twilio_client.messages.create(
            from_="whatsapp:+14155238886",  # Twilio sandbox number — same as your alerts
            to=f"whatsapp:{to_number}",
            body=message,
        )
        print(f" Maintenance WhatsApp sent for {vehicle}")
    except Exception as e:
        print(f" Maintenance WhatsApp failed: {e}")