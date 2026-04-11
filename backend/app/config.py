from pydantic_settings import BaseSettings


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

<<<<<<< HEAD
    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_verify_service_sid: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # Frontend URL
    frontend_url: str = "http://localhost:5173"
=======
    frontend_url: str = "http://localhost:3000"
>>>>>>> fbe4f8c4131a7d78e290c509fc46f652929199ac
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()