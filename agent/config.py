# agent/config.py — Agent configuration

import os
from typing import Literal

# LLM Configuration
LLM_PROVIDER: Literal["groq", "anthropic"] = "groq"  # Primary provider

# Groq Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"  # Options: mixtral-8x7b-32768, gemma-7b-it, llama-3.1-405b-reasoning
GROQ_MAX_TOKENS = 2048
GROQ_TEMPERATURE = 0.2   # low = factual, consistent answers for fleet data
GROQ_TOP_P = 0.85

# Anthropic Configuration (Fallback)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = "claude-3-5-haiku-20241022"
ANTHROPIC_MAX_TOKENS = 1024

# Memory Configuration
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
MEMORY_TTL = 3600  # 1 hour
MAX_MEMORY_TURNS = 10  # Keep last 10 turns

# System Prompt
FLEET_SYSTEM_PROMPT = """You are FleetPulse AI, an intelligent fleet management assistant.

Your role:
- Answer questions about vehicle locations, fuel levels, and trip history
- Monitor and report on active alerts (overspeeding, fuel theft, route deviation)
- Help managers make data-driven decisions about their fleet
- Provide actionable insights on driver behavior and vehicle performance

Available tools:
- query_vehicle_location: Get real-time GPS, speed, fuel of any vehicle
- get_trip_history: Get trip history for a vehicle over N days
- get_active_alerts: Get all unresolved anomaly alerts
- send_whatsapp_alert: Send WhatsApp/SMS alerts to drivers or managers
- generate_fuel_report: Generate fuel consumption analysis
- update_vehicle_status: Update vehicle status (active/inactive/maintenance/emergency)

Guidelines:
1. Always use tools to get current data — don't guess
2. Be concise and actionable in your responses
3. Highlight critical issues (low fuel, overspeeding, offline vehicles)
4. Provide context: vehicle ID, registration, driver name when relevant
5. Suggest actions: "Vehicle-5 fuel at 8% — recommend immediate refuel stop"

Tone: Professional, helpful, data-driven. You're a trusted advisor to fleet managers."""

# Model Options Reference
AVAILABLE_MODELS = {
    "groq": {
        "llama-3.3-70b-versatile": {
            "speed": "Fast",
            "cost": "Low",
            "best_for": "General queries (default)",
            "tokens_per_minute": 30000,
        },
        "mixtral-8x7b-32768": {
            "speed": "Very Fast",
            "cost": "Very Low",
            "best_for": "Quick responses, simple tasks",
            "tokens_per_minute": 40000,
        },
        "llama-3.1-405b-reasoning": {
            "speed": "Slower",
            "cost": "Higher",
            "best_for": "Complex reasoning, multi-step queries",
            "tokens_per_minute": 6000,
        },
        "gemma-7b-it": {
            "speed": "Very Fast",
            "cost": "Very Low",
            "best_for": "Lightweight, edge deployment",
            "tokens_per_minute": 40000,
        },
    },
    "anthropic": {
        "claude-3-5-haiku-20241022": {
            "speed": "Fast",
            "cost": "Low",
            "best_for": "General queries",
        },
        "claude-3-5-sonnet-20241022": {
            "speed": "Medium",
            "cost": "Medium",
            "best_for": "Complex reasoning",
        },
    },
}
