import uuid, random, json
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from twilio.rest import Client as TwilioClient
from app.config import settings
from app.db.dynamodb import get_dynamodb_resource

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def _table():
    db = get_dynamodb_resource()
    return db.Table('Users')

def _otp_table():
    db = get_dynamodb_resource()
    return db.Table('OTPStore')

# ─── Password ──────────────────────────────────────────────────────────────────

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

# ─── User queries ──────────────────────────────────────────────────────────────

from boto3.dynamodb.conditions import Key

def get_user_by_email(email: str):
    table = _table()
    resp = table.query(
        IndexName='email-index',
        KeyConditionExpression=Key('email').eq(email)
    )
    items = resp.get('Items', [])
    return items[0] if items else None

def get_user_by_id(user_id: str):
    table = _table()
    resp = table.get_item(Key={'user_id': user_id})
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

# ─── Email OTP (stored in Redis) ───────────────────────────────────────────────

def generate_email_otp(email: str) -> str:
    import redis
    otp = str(random.randint(100000, 999999))
    r = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)
    r.setex(f"otp:email:{email}", 600, otp)  # 10 min TTL
    return otp

def verify_email_otp(email: str, otp: str) -> bool:
    import redis
    r = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)
    stored = r.get(f"otp:email:{email}")
    if stored and stored == otp:
        r.delete(f"otp:email:{email}")
        # Mark email verified
        user = get_user_by_email(email)
        if user:
            _table().update_item(
                Key={'user_id': user['user_id']},
                UpdateExpression='SET email_verified = :v',
                ExpressionAttributeValues={':v': True}
            )
        return True
    return False

# ─── Phone OTP (Twilio Verify) ─────────────────────────────────────────────────

def send_phone_otp(phone: str):
    client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
    client.verify.v2.services(settings.twilio_verify_service_sid) \
        .verifications.create(to=phone, channel='sms')

def verify_phone_otp(phone: str, otp: str, user_id: str) -> bool:
    client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
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

# ─── Forgot / Reset Password ───────────────────────────────────────────────────

def generate_reset_token(email: str) -> str:
    import redis
    user = get_user_by_email(email)
    if not user:
        return None
    token = str(uuid.uuid4())
    r = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)
    r.setex(f"reset:{token}", 900, user['user_id'])  # 15 min TTL
    return token

def reset_password(token: str, new_password: str) -> bool:
    import redis
    r = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)
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

# ─── Google OAuth ──────────────────────────────────────────────────────────────

def get_google_auth_url() -> str:
    from urllib.parse import urlencode
    params = {
        'client_id': settings.google_client_id,
        'redirect_uri': settings.google_redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

def handle_google_callback(code: str) -> str:
    import httpx
    # Exchange code for tokens
    token_resp = httpx.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': settings.google_client_id,
        'client_secret': settings.google_client_secret,
        'redirect_uri': settings.google_redirect_uri,
        'grant_type': 'authorization_code',
    })
    token_data = token_resp.json()
    access_token = token_data.get('access_token')

    # Get user info
    user_resp = httpx.get('https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'})
    google_user = user_resp.json()

    email = google_user.get('email')
    name = google_user.get('name', '')

    # Upsert user
    user = get_user_by_email(email)
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            'user_id': user_id,
            'name': name,
            'email': email,
            'phone': '',
            'password_hash': '',
            'email_verified': True,
            'phone_verified': False,
            'provider': 'google',
            'created_at': datetime.utcnow().isoformat(),
        }
        _table().put_item(Item=user)

    return create_jwt(user['user_id'], user['email'])