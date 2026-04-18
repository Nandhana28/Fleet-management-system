import uuid, random, json
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from app.config import settings
from app.db.dynamodb import get_dynamodb_resource
from boto3.dynamodb.conditions import Key

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


# ─── Redis helper ─────────────────────────────────────────────────────────────

def _get_redis():
    import redis as redis_lib
    return redis_lib.from_url(settings.redis_url, decode_responses=True)


# ─── DynamoDB helpers ─────────────────────────────────────────────────────────

def _table():
    return get_dynamodb_resource().Table('Users')


# ─── Password ─────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)

def create_jwt(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


# ─── User queries ─────────────────────────────────────────────────────────────

def get_user_by_email(email: str):
    try:
        resp = _table().query(
            IndexName='email-index',
            KeyConditionExpression=Key('email').eq(email)
        )
        items = resp.get('Items', [])
        return items[0] if items else None
    except Exception as e:
        # If index doesn't exist, scan the table instead
        print(f"[Auth] Email index query failed: {e}, falling back to scan")
        resp = _table().scan(
            FilterExpression=Key('email').eq(email)
        )
        items = resp.get('Items', [])
        return items[0] if items else None

def get_user_by_id(user_id: str):
    resp = _table().get_item(Key={'user_id': user_id})
    return resp.get('Item')


# ─── Register ─────────────────────────────────────────────────────────────────

def register_user(name: str, email: str, phone: str, password: str) -> dict:
    if get_user_by_email(email):
        raise ValueError("An account with this email already exists.")
    user_id = str(uuid.uuid4())
    user = {
        'user_id': user_id,
        'name': name,
        'email': email,
        'phone': phone,
        'password_hash': hash_password(password),
        'email_verified': False,
        'phone_verified': False,
        'provider': 'email',
        'created_at': datetime.utcnow().isoformat(),
    }
    _table().put_item(Item=user)
    return user


# ─── Login ────────────────────────────────────────────────────────────────────

def login_user(email: str, password: str) -> str:
    user = get_user_by_email(email)
    if not user:
        raise ValueError("Invalid email or password.")
    if user.get('provider') != 'email':
        raise ValueError(f"This account uses {user.get('provider')} login.")
    if not verify_password(password, user['password_hash']):
        raise ValueError("Invalid email or password.")
    return create_jwt(user['user_id'], user['email'])


# ─── Email OTP ────────────────────────────────────────────────────────────────

def generate_email_otp(email: str) -> str:
    otp = str(random.randint(100000, 999999))
    _get_redis().setex(f"otp:email:{email}", 600, otp)
    return otp

def verify_email_otp(email: str, otp: str) -> bool:
    r = _get_redis()
    stored = r.get(f"otp:email:{email}")
    if stored and stored == otp:
        r.delete(f"otp:email:{email}")
        user = get_user_by_email(email)
        if user:
            _table().update_item(
                Key={'user_id': user['user_id']},
                UpdateExpression='SET email_verified = :v',
                ExpressionAttributeValues={':v': True}
            )
        return True
    return False


# ─── Phone OTP (Twilio) ───────────────────────────────────────────────────────

def send_phone_otp(phone: str):
    from twilio.rest import Client
    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    client.verify.v2.services(settings.twilio_verify_service_sid) \
        .verifications.create(to=phone, channel='sms')

def verify_phone_otp(phone: str, otp: str, user_id: str) -> bool:
    from twilio.rest import Client
    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    result = client.verify.v2.services(settings.twilio_verify_service_sid) \
        .verification_checks.create(to=phone, code=otp)
    if result.status == 'approved':
        _table().update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET phone_verified = :v',
            ExpressionAttributeValues={':v': True}
        )
        return True
    return False


# ─── Forgot / Reset Password ──────────────────────────────────────────────────

def generate_reset_token(email: str):
    user = get_user_by_email(email)
    if not user:
        return None
    token = str(uuid.uuid4())
    _get_redis().setex(f"reset:{token}", 900, user['user_id'])
    return token

def reset_password(token: str, new_password: str) -> bool:
    r = _get_redis()
    user_id = r.get(f"reset:{token}")
    if not user_id:
        return False
    _table().update_item(
        Key={'user_id': user_id},
        UpdateExpression='SET password_hash = :h',
        ExpressionAttributeValues={':h': hash_password(new_password)}
    )
    r.delete(f"reset:{token}")
    return True


# ─── Google OAuth — ASYNC ────────────────────────────────────────────────────

async def handle_google_callback(code: str, mode: str = 'login') -> str:
    import httpx

    # ✅ async client with timeout — no more hanging
    async with httpx.AsyncClient(timeout=10.0) as client:

        # Step 1: Exchange code for token
        token_resp = await client.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': settings.google_client_id,
                'client_secret': settings.google_client_secret,
                'redirect_uri': settings.google_redirect_uri,
                'grant_type': 'authorization_code',
            }
        )
        token_data = token_resp.json()
        access_token = token_data.get('access_token')

        if not access_token:
            raise ValueError("google_token_failed")

        # Step 2: Get user info
        user_resp = await client.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        google_user = user_resp.json()

    email = google_user.get('email')
    name  = google_user.get('name', '')

    if not email:
        raise ValueError("google_no_email")

    user = get_user_by_email(email)

    if mode == 'login':
        if not user:
            raise ValueError("account_not_registered")
        return create_jwt(user['user_id'], user['email'])

    elif mode == 'signup':
        if user:
            raise ValueError("account_already_exists")
        user_id = str(uuid.uuid4())
        _table().put_item(Item={
            'user_id': user_id,
            'name': name,
            'email': email,
            'phone': '',
            'password_hash': '',
            'email_verified': True,
            'phone_verified': False,
            'provider': 'google',
            'created_at': datetime.utcnow().isoformat(),
        })
        return create_jwt(user_id, email)

    raise ValueError("invalid_mode")

def get_alert_by_id(alert_id: str) -> dict | None:
    from app.db import queries
    return queries.get_alert_by_id(alert_id)