from pydantic_settings import BaseSettings
from pathlib import Path

# Load .env first, then .env.local (if present) — .env.local wins, so local VS Code
# dev overrides Docker hostnames without touching .env which docker-compose uses.
_base = Path(__file__).resolve().parent.parent  # backend/
_env_files = [str(_base / ".env")]
_local = _base / ".env.local"
if _local.exists():
    _env_files.append(str(_local))

class Settings(BaseSettings):
    use_localstack: bool = True
    app_env: str = "development"
    aws_access_key_id: str = "test"
    aws_secret_access_key: str = "test"
    aws_region: str = "ap-south-1"
    localstack_endpoint: str = "http://localhost:4566"
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"
    jwt_secret_key: str = "dev-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_verify_service_sid: str = ""
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://127.0.0.1:8000/auth/google/callback"
    # Frontend URL
    frontend_url: str = "http://localhost:5173"
    anthropic_api_key: str = ""
    groq_api_key: str = ""

    class Config:
        env_file = _env_files
        case_sensitive = False
        extra = "ignore"

settings = Settings()