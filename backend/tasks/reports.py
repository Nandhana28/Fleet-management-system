# backend/tasks/reports.py
from tasks.celery_app import celery
from app.db import queries


@celery.task(name="tasks.reports.generate_daily_report")
def generate_daily_report():
    """
    Runs every night at 11PM via Celery Beat.
    Aggregates vehicle data and generates daily summary.
    PDF generation + S3 upload + SES email — Week 4.
    """
    vehicles = queries.get_all_vehicles()
    drivers = queries.get_all_drivers()
    alerts = queries.get_all_alerts(active_only=False)

    summary = {
        "total_vehicles": len(vehicles),
        "total_drivers": len(drivers),
        "total_alerts_today": len(alerts),
        "unresolved_alerts": len([a for a in alerts if not a.get("resolved")]),
    }

    print(f"[Daily Report] {summary}")
    return summary