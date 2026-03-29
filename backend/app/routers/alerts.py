# backend/app/routers/alerts.py
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.db import queries

router = APIRouter()


@router.get("")
def list_alerts(active_only: bool = True, user=Depends(get_current_user)):
    return queries.get_all_alerts(active_only=active_only)


@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    alert = queries.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    updated = queries.resolve_alert(alert_id)
    return updated
