import json
import os
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from fleet_agent import build_fleet_agent, query_agent

# FastAPI app
app = FastAPI(title="FleetPulse AI Agent API")

# Initialize agent
agent = build_fleet_agent(os.environ.get("GROQ_API_KEY", ""))


class AgentRequest(BaseModel):
    question: str
    session_id: str = "default"


async def stream_agent_response(
    agent, question: str, session_id: str
) -> AsyncGenerator[str, None]:
    """
    Stream agent response as Server-Sent Events
    Used by FastAPI StreamingResponse
    """
    try:
        async for chunk in agent.astream(
            {
                "messages": [HumanMessage(content=question)],
                "session_id": session_id,
            }
        ):
            if "agent" in chunk:
                messages = chunk["agent"].get("messages", [])
                for msg in messages:
                    if hasattr(msg, "content") and msg.content:
                        yield f"data: {json.dumps({'text': msg.content})}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@app.post("/api/agent")
async def agent_endpoint(request: AgentRequest):
    """POST /api/agent — query the fleet AI agent"""
    response = query_agent(agent, request.question, request.session_id)
    return {"response": response, "session_id": request.session_id}


@app.post("/api/agent/stream")
async def agent_stream_endpoint(request: AgentRequest):
    """POST /api/agent/stream — streaming response"""
    return StreamingResponse(
        stream_agent_response(agent, request.question, request.session_id),
        media_type="text/event-stream",
    )


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "FleetPulse AI Agent"}
