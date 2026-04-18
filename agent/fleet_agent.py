import json
import os
from typing import AsyncGenerator

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated, Sequence
import operator

from agent.tools import (
    query_vehicle_location,
    get_trip_history,
    get_active_alerts,
    send_whatsapp_alert,
    generate_fuel_report,
    update_vehicle_status,
)
from agent.prompts import FLEET_SYSTEM_PROMPT
from agent.config import (
    GROQ_API_KEY,
    GROQ_MODEL,
    GROQ_MAX_TOKENS,
    GROQ_TEMPERATURE,
    GROQ_TOP_P,
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
    REDIS_URL,
    MEMORY_TTL,
    MAX_MEMORY_TURNS,
)


def _get_redis():
    try:
        import redis
        client = redis.from_url(REDIS_URL, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


def save_to_memory(session_id: str, role: str, content: str):
    client = _get_redis()
    if not client:
        return
    try:
        key = f"agent:memory:{session_id}"
        data = client.get(key)
        memory = json.loads(data) if data else []
        memory.append({"role": role, "content": content})
        memory = memory[-MAX_MEMORY_TURNS:]
        client.setex(key, MEMORY_TTL, json.dumps(memory))
    except Exception:
        pass


def get_from_memory(session_id: str) -> list:
    client = _get_redis()
    if not client:
        return []
    try:
        key = f"agent:memory:{session_id}"
        data = client.get(key)
        return json.loads(data) if data else []
    except Exception:
        return []


@tool
def tool_query_vehicle_location(vehicle_id: str) -> str:
    """Query the latest GPS location, speed and fuel level of a vehicle"""
    return json.dumps(query_vehicle_location(vehicle_id))

@tool
def tool_get_trip_history(vehicle_id: str, days: int = 7) -> str:
    """Get the trip history for a vehicle for the last N days"""
    return json.dumps(get_trip_history(vehicle_id, days), default=str)

@tool
def tool_get_active_alerts() -> str:
    """Get all unresolved anomaly alerts — overspeeding, fuel theft, route deviation"""
    return json.dumps(get_active_alerts(), default=str)

@tool
def tool_send_whatsapp_alert(phone: str, message: str) -> str:
    """Send a WhatsApp or SMS alert to a phone number"""
    return json.dumps(send_whatsapp_alert(phone, message))

@tool
def tool_generate_fuel_report(vehicle_id: str) -> str:
    """Generate a fuel consumption report for a vehicle"""
    return json.dumps(generate_fuel_report(vehicle_id), default=str)

@tool
def tool_update_vehicle_status(vehicle_id: str, status: str) -> str:
    """Update the status of a vehicle — active, inactive, maintenance, emergency"""
    return json.dumps(update_vehicle_status(vehicle_id, status))


class AgentState(TypedDict):
    messages: Annotated[Sequence, operator.add]
    session_id: str


def build_fleet_agent(api_key: str, use_groq: bool = True):
    """
    Build the fleet agent with LLM and tools.
    
    Args:
        api_key: API key for the LLM provider
        use_groq: If True, use Groq; if False, try Anthropic Claude
    """
    tools = [
        tool_query_vehicle_location,
        tool_get_trip_history,
        tool_get_active_alerts,
        tool_send_whatsapp_alert,
        tool_generate_fuel_report,
        tool_update_vehicle_status,
    ]

    if use_groq:
        # Use Groq as primary LLM
        llm = ChatGroq(
            model=GROQ_MODEL,
            api_key=api_key,
            max_tokens=GROQ_MAX_TOKENS,
            temperature=GROQ_TEMPERATURE,
            top_p=GROQ_TOP_P,
        )
    else:
        # Fallback to Anthropic Claude
        try:
            from langchain_anthropic import ChatAnthropic
            from agent.config import ANTHROPIC_MAX_TOKENS
            llm = ChatAnthropic(
                model=ANTHROPIC_MODEL,
                api_key=api_key,
                max_tokens=ANTHROPIC_MAX_TOKENS,
            )
        except ImportError:
            raise ImportError("langchain-anthropic not installed. Install with: pip install langchain-anthropic")
    
    llm_with_tools = llm.bind_tools(tools)

    def agent_node(state: AgentState):
        messages = state["messages"]
        session_id = state.get("session_id", "default")
        all_messages = [SystemMessage(content=FLEET_SYSTEM_PROMPT)] + list(messages)
        response = llm_with_tools.invoke(all_messages)
        # Only save to memory on the final response (no tool calls pending)
        has_tool_calls = bool(getattr(response, "tool_calls", None))
        if not has_tool_calls and response.content:
            # Find the last HumanMessage in the state (original user question)
            for msg in reversed(list(messages)):
                if isinstance(msg, HumanMessage):
                    save_to_memory(session_id, "user", msg.content)
                    break
            save_to_memory(session_id, "assistant", response.content)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(tools)
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue)
    workflow.add_edge("tools", "agent")

    return workflow.compile()


def query_agent(agent, question: str, session_id: str = "default") -> str:
    history = get_from_memory(session_id)
    messages = []
    for turn in history[-5:]:
        if turn["role"] == "user":
            messages.append(HumanMessage(content=turn["content"]))
        else:
            messages.append(AIMessage(content=turn["content"]))
    messages.append(HumanMessage(content=question))
    result = agent.invoke({"messages": messages, "session_id": session_id})
    return result["messages"][-1].content


async def stream_agent_response(
    agent, question: str, session_id: str
) -> AsyncGenerator[str, None]:
    history = get_from_memory(session_id)
    messages = []
    for turn in history[-5:]:
        if turn["role"] == "user":
            messages.append(HumanMessage(content=turn["content"]))
        else:
            messages.append(AIMessage(content=turn["content"]))
    messages.append(HumanMessage(content=question))

    try:
        # Collect tool calls for UI badges; accumulate final text — emit once at end.
        # This prevents double-text when LangGraph emits multiple agent chunks and
        # avoids infinite loops via recursion_limit.
        final_text = None
        async for chunk in agent.astream(
            {"messages": messages, "session_id": session_id},
            config={"recursion_limit": 10},
        ):
            if "tools" in chunk:
                for msg in chunk["tools"].get("messages", []):
                    tool_name = getattr(msg, "name", None)
                    if tool_name:
                        yield f"data: {json.dumps({'type': 'tool', 'content': tool_name})}\n\n"

            if "agent" in chunk:
                msgs = chunk["agent"].get("messages", [])
                if msgs:
                    msg = msgs[-1]
                    # Only capture text from final agent turns (no pending tool calls)
                    has_tool_calls = bool(getattr(msg, "tool_calls", None))
                    if hasattr(msg, "content") and msg.content and not has_tool_calls:
                        final_text = msg.content  # keep updating — last one wins

        # Emit exactly one text event after the graph finishes
        if final_text:
            yield f"data: {json.dumps({'type': 'text', 'content': final_text})}\n\n"
        yield "data: [DONE]\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        yield "data: [DONE]\n\n"