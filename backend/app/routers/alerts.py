# backend/app/routers/alerts.py
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.services import alert_service

router = APIRouter()


@router.get("")
def list_alerts(active_only: bool = True, user=Depends(get_current_user)):
    if active_only:
        return alert_service.get_active_alerts()
    return alert_service.get_all_alerts()


@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    updated = alert_service.resolve_alert(alert_id)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return updated