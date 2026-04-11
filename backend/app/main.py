from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from app.config import settings
from app.routers import health, vehicles, alerts, analytics, agent
from app.routers import auth

security = HTTPBearer()

app = FastAPI(
    title="FleetPulse API",
    description="Real-Time Fleet Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(agent.router, prefix="/agent", tags=["agent"])
app.include_router(auth.router)