import json
import redis
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated, Sequence
import operator

from tools import (
    query_vehicle_location,
    get_trip_history,
    get_active_alerts,
    send_whatsapp_alert,
    generate_fuel_report,
    update_vehicle_status,
)

# ─── Redis Memory Setup ───────────────────────────────────────────────────────
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
MEMORY_TTL = 3600  # 1 hour
MAX_MEMORY_TURNS = 10  # Remember last 10 turns


def save_to_memory(session_id: str, role: str, content: str):
    """Save conversation turn to Redis — skip if Redis not available"""
    try:
        key = f"agent:memory:{session_id}"
        memory = get_from_memory(session_id)
        memory.append({"role": role, "content": content})
        if len(memory) > MAX_MEMORY_TURNS:
            memory = memory[-MAX_MEMORY_TURNS:]
        redis_client.setex(key, MEMORY_TTL, json.dumps(memory))
    except Exception:
        pass  # Redis not available — skip memory


def get_from_memory(session_id: str) -> list:
    """Get conversation history from Redis — return empty if not available"""
    try:
        key = f"agent:memory:{session_id}"
        data = redis_client.get(key)
        return json.loads(data) if data else []
    except Exception:
        return []  # Redis not available — return empty


# ─── Define LangChain Tools ───────────────────────────────────────────────────
@tool
def tool_query_vehicle_location(vehicle_id: str) -> str:
    """Query the latest GPS location, speed and fuel level of a vehicle"""
    result = query_vehicle_location(vehicle_id)
    return json.dumps(result)


@tool
def tool_get_trip_history(vehicle_id: str, days: int = 7) -> str:
    """Get the trip history for a vehicle for the last N days"""
    result = get_trip_history(vehicle_id, days)
    return json.dumps(result, default=str)


@tool
def tool_get_active_alerts() -> str:
    """Get all unresolved anomaly alerts — overspeeding, fuel theft, route deviation"""
    result = get_active_alerts()
    return json.dumps(result, default=str)


@tool
def tool_send_whatsapp_alert(phone: str, message: str) -> str:
    """Send a WhatsApp or SMS alert to a phone number"""
    result = send_whatsapp_alert(phone, message)
    return json.dumps(result)


@tool
def tool_generate_fuel_report(vehicle_id: str) -> str:
    """Generate a fuel consumption report for a vehicle"""
    result = generate_fuel_report(vehicle_id)
    return json.dumps(result, default=str)


@tool
def tool_update_vehicle_status(vehicle_id: str, status: str) -> str:
    """Update the status of a vehicle — active, inactive, maintenance, emergency"""
    result = update_vehicle_status(vehicle_id, status)
    return json.dumps(result)


# ─── Agent State ──────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[Sequence, operator.add]
    session_id: str


# ─── Build LangGraph Agent ────────────────────────────────────────────────────
def build_fleet_agent(api_key: str):
    """
    Build the FleetPulse agentic AI using LangGraph
    Flow: user query → agent thinks → picks tool → executes → returns response
    """

    # All tools available to the agent
    tools = [
        tool_query_vehicle_location,
        tool_get_trip_history,
        tool_get_active_alerts,
        tool_send_whatsapp_alert,
        tool_generate_fuel_report,
        tool_update_vehicle_status,
    ]

    # Claude API as LLM backbone
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=api_key,
        max_tokens=1000,
    )
    # Bind tools to LLM
    llm_with_tools = llm.bind_tools(tools)

    # System prompt — tells Claude what it is
    system_prompt = """You are FleetPulse AI, an intelligent fleet management assistant
for small logistics businesses in Tamil Nadu, India.

You help fleet owners by:
- Tracking vehicle locations in real time
- Detecting fuel theft and overspeeding anomalies
- Generating fuel and trip reports
- Sending alerts to drivers and owners
- Managing vehicle statuses

You have access to real AWS DynamoDB data. Always use tools to get real data.
Be concise, helpful and professional. Respond in simple English.
When reporting locations, mention the area in Coimbatore if possible."""

    # Agent node — LLM decides what to do
    def agent_node(state: AgentState):
        messages = state["messages"]
        session_id = state.get("session_id", "default")

        # Add system message
        all_messages = [SystemMessage(content=system_prompt)] + list(messages)

        # Get LLM response
        response = llm_with_tools.invoke(all_messages)

        # Save to memory
        if messages:
            last_msg = messages[-1]
            if hasattr(last_msg, "content"):
                save_to_memory(session_id, "user", last_msg.content)
        save_to_memory(session_id, "assistant", response.content)

        return {"messages": [response]}

    # Decide whether to use tools or end
    def should_continue(state: AgentState):
        messages = state["messages"]
        last_message = messages[-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    # Build the graph
    tool_node = ToolNode(tools)
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)

    # Add edges
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue)
    workflow.add_edge("tools", "agent")

    # Compile
    agent = workflow.compile()
    return agent


# ─── Query Agent ──────────────────────────────────────────────────────────────
def query_agent(agent, question: str, session_id: str = "default") -> str:
    """
    Send a question to the fleet agent and get a response
    """
    # Get conversation history from Redis
    history = get_from_memory(session_id)

    # Build messages with history
    messages = []
    for turn in history[-5:]:  # Last 5 turns for context
        if turn["role"] == "user":
            messages.append(HumanMessage(content=turn["content"]))
        else:
            messages.append(AIMessage(content=turn["content"]))

    # Add current question
    messages.append(HumanMessage(content=question))

    # Run agent
    result = agent.invoke(
        {
            "messages": messages,
            "session_id": session_id,
        }
    )

    # Get final response
    final_message = result["messages"][-1]
    return final_message.content


# ─── Main Test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import os

    api_key = os.environ.get("GROQ_API_KEY", "your-api-key-here")

    print("🤖 FleetPulse AI Agent Starting...")
    agent = build_fleet_agent(api_key)

    # Test questions
    questions = [
        "What are all the active alerts right now?",
        "Where is vehicle-1 currently?",
        "Generate a fuel report for vehicle-2",
    ]

    for question in questions:
        print(f"\n👤 User: {question}")
        response = query_agent(agent, question)
        print(f"🤖 Agent: {response}")
