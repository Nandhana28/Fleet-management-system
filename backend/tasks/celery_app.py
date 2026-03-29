# backend/tasks/celery_app.py
from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery = Celery(
    "fleetpulse",
    broker=settings.celery_broker_url,
    backend=settings.redis_url,
    include=["tasks.reports", "tasks.alerts"],
)

celery.conf.beat_schedule = {
    "daily-report-11pm": {
        "task": "tasks.reports.generate_daily_report",
        "schedule": crontab(hour=23, minute=0),
    },
    "unresolved-alerts-every-5min": {
        "task": "tasks.alerts.batch_unresolved_alerts",
        "schedule": crontab(minute="*/5"),
    },
}

celery.conf.timezone = "Asia/Kolkata"