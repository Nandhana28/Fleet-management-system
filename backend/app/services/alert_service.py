# backend/app/services/alert_service.py
from app.db import queries
from app.services.cache_service import set_active_alert_count


def get_active_alerts() -> list:
    alerts = queries.get_all_alerts(active_only=True)
    set_active_alert_count(len(alerts))
    return alerts


def get_all_alerts() -> list:
    return queries.get_all_alerts(active_only=False)


def resolve_alert(alert_id: str) -> dict | None:
    alert = queries.get_alert_by_id(alert_id)
    if not alert:
        return None
    updated = queries.resolve_alert(alert_id)
    # refresh alert count in Redis
    active = queries.get_all_alerts(active_only=True)
    set_active_alert_count(len(active))
    return updated