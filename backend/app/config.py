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

    frontend_url: str = "http://localhost:3000"
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()