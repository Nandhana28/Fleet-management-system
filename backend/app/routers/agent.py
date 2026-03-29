# backend/app/routers/agent.py
# Stub — real LangChain streaming wired in Week 3 once agent/ is built by Farhana
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user

router = APIRouter()


class AgentRequest(BaseModel):
    message: str
    user_id: str = "default"


@router.post("")
def agent_chat(request: AgentRequest, user=Depends(get_current_user)):
    # Week 3: replace this with LangChain StreamingResponse
    return {
        "response": f"[STUB] Agent received: {request.message}. Real agent wired in Week 3.",
        "tool_used": None,
        "data": None,
    }
