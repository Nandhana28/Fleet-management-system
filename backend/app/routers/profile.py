# backend/app/routers/profile.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.dependencies import get_current_user
from app.db import queries
import uuid
from datetime import datetime
import json

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None


class PreferencesUpdate(BaseModel):
    theme: Optional[str] = None  # "light" or "dark"
    language: Optional[str] = None
    timezone: Optional[str] = None
    notification_frequency: Optional[str] = None  # "never", "realtime", "hourly", "daily"


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


@router.get("/me")
def get_profile(user=Depends(get_current_user)):
    """Fetch current user profile"""
    try:
        user_data = queries.get_user_by_id(user['user_id'])
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        # Remove sensitive fields
        user_data.pop('password_hash', None)
        return user_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/me")
def update_profile(req: ProfileUpdate, user=Depends(get_current_user)):
    """Update user profile"""
    try:
        updates = req.dict(exclude_unset=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates['last_updated'] = datetime.utcnow().isoformat()
        queries.update_user(user['user_id'], updates)

        updated_user = queries.get_user_by_id(user['user_id'])
        updated_user.pop('password_hash', None)

        return {"message": "Profile updated", "user": updated_user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/preferences")
def update_preferences(req: PreferencesUpdate, user=Depends(get_current_user)):
    """Update user preferences (theme, language, timezone, notification frequency)"""
    try:
        prefs = req.dict(exclude_unset=True)
        if not prefs:
            raise HTTPException(status_code=400, detail="No preferences to update")

        # Store preferences as JSON in user record
        updates = {'preferences': json.dumps(prefs), 'last_updated': datetime.utcnow().isoformat()}
        queries.update_user(user['user_id'], updates)

        return {"message": "Preferences updated", "preferences": prefs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload user avatar"""
    try:
        if file.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Simple local storage approach
        filename = f"avatar_{user['user_id']}_{int(datetime.utcnow().timestamp())}.jpg"
        avatar_url = f"/avatars/{filename}"

        # In production: save to S3, for now just store path
        updates = {'avatar_url': avatar_url, 'last_updated': datetime.utcnow().isoformat()}
        queries.update_user(user['user_id'], updates)

        return {"message": "Avatar uploaded", "avatar_url": avatar_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activity")
def get_activity(user=Depends(get_current_user), limit: int = 50):
    """Get user activity log (logins, actions)"""
    try:
        # Fetch from activity log (stored in DynamoDB)
        activities = queries.get_user_activity(user['user_id'], limit=limit)

        return {
            "activities": activities or [],
            "total": len(activities) if activities else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/activity/log")
def log_activity(action: str, user=Depends(get_current_user)):
    """Log user activity (for internal use)"""
    try:
        activity = {
            'user_id': user['user_id'],
            'action': action,
            'timestamp': datetime.utcnow().isoformat(),
            'ip_address': user.get('ip_address', 'unknown')
        }
        queries.create_activity_log(activity)
        return {"message": "Activity logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
