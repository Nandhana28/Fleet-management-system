import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.db.dynamodb import get_table


router = APIRouter()

SETTINGS_TABLE = "AgentConfig"


class Thresholds(BaseModel):
    fuel_low: str = "20"
    speed_limit: str = "80"
    idle_timeout: str = "15"

class Notifications(BaseModel):
    whatsapp: str = ""
    email: str = ""

class AlertTypes(BaseModel):
    fuel_theft: bool = True
    overspeeding: bool = True
    route_deviation: bool = True
    offline: bool = True

class SettingsRequest(BaseModel):
    thresholds: Thresholds
    notifications: Notifications
    alerts: AlertTypes


@router.get("")
def get_settings(user=Depends(get_current_user)):
    import traceback
    try:
        table = get_table(SETTINGS_TABLE)
        response = table.get_item(Key={"config_key": f"settings:{user}"})
        item = response.get("Item")
        if not item:
            return {
                "thresholds": {"fuel_low": "20", "speed_limit": "80", "idle_timeout": "15"},
                "notifications": {"whatsapp": "", "email": ""},
                "alerts": {"fuel_theft": True, "overspeeding": True, "route_deviation": True, "offline": True},
            }
        return {
            "thresholds": item.get("thresholds", {}),
            "notifications": item.get("notifications", {}),
            "alerts": item.get("alerts", {}),
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def save_settings(req: SettingsRequest, user=Depends(get_current_user)):
    import traceback
    try:
        table = get_table(SETTINGS_TABLE)
        table.put_item(Item={
            "config_key": f"settings:{user}",
            "user_id": user,
            "thresholds": req.thresholds.model_dump(),
            "notifications": req.notifications.model_dump(),
            "alerts": req.alerts.model_dump(),
        })
        return {"message": "Settings saved successfully."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/test-alert")
def test_alert(user=Depends(get_current_user)):
    """Trigger a test alert to the logged-in user's phone/email."""
    try:
        # Get settings-configured contacts
        table = get_table(SETTINGS_TABLE)
        response = table.get_item(Key={"config_key": f"settings:{user}"})
        item = response.get("Item", {})
        notifs = item.get("notifications", {})
        phone = notifs.get("whatsapp", "")
        email = notifs.get("email", "")

        # Fall back to registration phone/email if not in settings
        if not phone or not email:
            users_table = get_table("Users")
            user_resp = users_table.get_item(Key={"user_id": user})
            user_item = user_resp.get("Item", {})
            phone = phone or user_item.get("phone", "")
            email = email or user_item.get("email", "")

        if not phone and not email:
            raise HTTPException(status_code=400, detail="No phone or email found for your account.")

        # Import here to avoid circular import
        import sys, os
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from tasks.alerts import send_alert_notification

        message = (
            "FleetPulse Test Alert: Your notification setup is working! "
            "You will receive alerts for fuel theft, overspeeding, and route deviation."
        )
        send_alert_notification(phone, email, message)

        return {"message": "Test alert sent!", "phone": phone, "email": email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-report")
def trigger_report(user=Depends(get_current_user)):
    """Manually trigger PDF report generation."""
    import traceback, sys, os
    try:
        # Add backend to path
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)

        from tasks.reports import generate_daily_report
        result = generate_daily_report()
        return {"message": "Report generated!", "result": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download-report")
def download_report(user=Depends(get_current_user)):
    """Download the latest generated PDF report."""
    import glob
    from fastapi.responses import FileResponse
    reports_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        'reports'
    )
    files = glob.glob(os.path.join(reports_dir, '*.pdf'))
    if not files:
        raise HTTPException(status_code=404, detail="No reports generated yet. Click Generate Report first.")
    latest = max(files, key=os.path.getctime)
    return FileResponse(
        latest,
        media_type='application/pdf',
        filename=os.path.basename(latest)
    )