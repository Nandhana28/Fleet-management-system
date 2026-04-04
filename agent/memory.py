import json
import redis

# Redis connection
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

MEMORY_TTL = 3600  # 1 hour
MAX_TURNS = 10


def save_turn(session_id: str, role: str, content: str):
    """Save one conversation turn to Redis"""
    try:
        key = f"agent:memory:{session_id}"
        history = get_history(session_id)
        history.append({"role": role, "content": content})
        if len(history) > MAX_TURNS:
            history = history[-MAX_TURNS:]
        redis_client.setex(key, MEMORY_TTL, json.dumps(history))
    except Exception:
        pass


def get_history(session_id: str) -> list:
    """Get conversation history from Redis"""
    try:
        key = f"agent:memory:{session_id}"
        data = redis_client.get(key)
        return json.loads(data) if data else []
    except Exception:
        return []


def clear_memory(session_id: str):
    """Clear conversation memory for a session"""
    try:
        key = f"agent:memory:{session_id}"
        redis_client.delete(key)
    except Exception:
        pass
