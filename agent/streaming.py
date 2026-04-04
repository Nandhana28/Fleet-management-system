import json
from typing import AsyncGenerator


async def stream_agent_response(
    agent, question: str, session_id: str
) -> AsyncGenerator[str, None]:
    """
    Stream agent response as Server-Sent Events
    Used by FastAPI StreamingResponse
    """
    try:
        from langchain_core.messages import HumanMessage

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
