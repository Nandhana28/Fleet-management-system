# backend/tasks/alerts.py
from tasks.celery_app import celery
from app.db import queries


@celery.task(name="tasks.alerts.batch_unresolved_alerts")
def batch_unresolved_alerts():
    """
    Runs every 5 minutes via Celery Beat.
    Re-notifies owner of unresolved alerts.
    Twilio WhatsApp integration — Week 4.
    """
    unresolved = queries.get_all_alerts(active_only=True)

    for alert in unresolved:
        print(f"[Alert Re-notify] {alert.get('alert_type')} — vehicle {alert.get('vehicle_id')}")

    return {"re_notified": len(unresolved)}