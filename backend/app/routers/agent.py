import sys
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.config import settings

# Add project root to path so agent/ package is importable from backend
_project_root = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from agent.fleet_agent import build_fleet_agent, stream_agent_response, query_agent

router = APIRouter()

_agent_instance = None

def get_agent():
    global _agent_instance
    if _agent_instance is None:
        # Prefer Groq, fallback to Anthropic
        groq_key = settings.groq_api_key
        anthropic_key = settings.anthropic_api_key
        
        if groq_key:
            api_key = groq_key
            use_groq = True
        elif anthropic_key:
            api_key = anthropic_key
            use_groq = False
        else:
            raise HTTPException(
                status_code=503,
                detail="GROQ_API_KEY or ANTHROPIC_API_KEY not configured. Set one in your .env file."
            )
        
        _agent_instance = build_fleet_agent(api_key, use_groq=use_groq)
    return _agent_instance


class AgentRequest(BaseModel):
    message: str
    session_id: str = "default"


@router.post("")
async def agent_chat(
    request: AgentRequest,
    user=Depends(get_current_user)
):
    agent = get_agent()
    return StreamingResponse(
        stream_agent_response(agent, request.message, request.session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/sync")
async def agent_chat_sync(
    request: AgentRequest,
    user=Depends(get_current_user)
):
    agent = get_agent()
    response = query_agent(agent, request.message, request.session_id)
    return {"response": response, "session_id": request.session_id}


@router.get("/tools")
def list_tools(user=Depends(get_current_user)):
    return {
        "tools": [
            {"name": "query_vehicle_location", "description": "Get real-time location, speed and fuel of a vehicle"},
            {"name": "get_trip_history", "description": "Get trip history for a vehicle over last N days"},
            {"name": "get_active_alerts", "description": "Get all unresolved anomaly alerts"},
            {"name": "send_whatsapp_alert", "description": "Send WhatsApp/SMS alert to a phone number"},
            {"name": "generate_fuel_report", "description": "Generate fuel consumption report for a vehicle"},
            {"name": "update_vehicle_status", "description": "Update vehicle status (active/inactive/maintenance/emergency)"},
        ]
    }