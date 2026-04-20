from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from app.services import auth_service
from app.config import settings
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# ─── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class EmailOTPRequest(BaseModel):
    email: EmailStr

class VerifyEmailOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class PhoneOTPRequest(BaseModel):
    phone: str
    user_id: str

class VerifyPhoneOTPRequest(BaseModel):
    phone: str
    otp: str
    user_id: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# ─── Register ─────────────────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest):
    try:
        user = auth_service.register_user(req.name, req.email, req.phone, req.password)

        # Send OTP via WhatsApp/SMS to phone number
        try:
            auth_service.send_phone_otp(req.phone)
            otp_channel = "WhatsApp/SMS"
        except Exception as e:
            print(f"[OTP] Phone OTP failed: {e}, falling back to console")
            otp = auth_service.generate_email_otp(req.email)
            print(f"[DEV] Fallback OTP for {req.email}: {otp}")
            otp_channel = "email (fallback)"

        return {
            "message": f"Account created! OTP sent via {otp_channel} to {req.phone}",
            "user_id": user['user_id']
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login")
def login(req: LoginRequest):
    try:
        token = auth_service.login_user(req.email, req.password)
        return {"token": token}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# ─── Email OTP ────────────────────────────────────────────────────────────────

@router.post("/send-email-otp")
def send_email_otp(req: EmailOTPRequest):
    otp = auth_service.generate_email_otp(req.email)
    print(f"[DEV] Email OTP for {req.email}: {otp}")
    return {"message": "OTP sent to email."}

@router.post("/verify-email")
def verify_email(req: VerifyEmailOTPRequest):
    if not auth_service.verify_email_otp(req.email, req.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    return {"message": "Email verified successfully."}

# ─── Phone OTP ────────────────────────────────────────────────────────────────

@router.post("/send-phone-otp")
def send_phone_otp(req: PhoneOTPRequest):
    try:
        auth_service.send_phone_otp(req.phone)
        return {"message": "OTP sent via SMS."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-phone")
def verify_phone(req: VerifyPhoneOTPRequest):
    if not auth_service.verify_phone_otp(req.phone, req.otp, req.user_id):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    return {"message": "Phone verified successfully."}

# ─── Forgot / Reset Password ──────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    token = auth_service.generate_reset_token(req.email)
    if token:
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        print(f"[DEV] Reset link for {req.email}: {reset_url}")
    return {"message": "If this email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    if not auth_service.reset_password(req.token, req.new_password):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    return {"message": "Password updated successfully."}

# ─── Google OAuth ─────────────────────────────────────────────────────────────

@router.get("/google")
def google_login(mode: str = 'login'):
    from urllib.parse import urlencode
    params = {
        'client_id': settings.google_client_id,
        'redirect_uri': settings.google_redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'select_account',   # ✅ forces account picker, no hang
        'state': mode,
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, state: str = 'login'):
    # ✅ async route — won't block the server
    try:
        token = await auth_service.handle_google_callback(code, mode=state)
        return RedirectResponse(
            f"{settings.frontend_url}/auth-success?token={token}&mode={state}"
        )
    except ValueError as e:
        error = str(e)
        if error == "account_not_registered":
            return RedirectResponse(f"{settings.frontend_url}/login?error=not_registered")
        elif error == "account_already_exists":
            return RedirectResponse(f"{settings.frontend_url}/signup?error=already_exists")
        raise HTTPException(status_code=400, detail=error)


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, user=Depends(get_current_user)):
    try:
        user_data = auth_service.get_user_by_email(user['email'])
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        if not auth_service.verify_password(req.old_password, user_data.get('password_hash', '')):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        new_hash = auth_service.hash_password(req.new_password)
        from app.db.queries import update_user
        update_user(user['user_id'], {'password_hash': new_hash})
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))