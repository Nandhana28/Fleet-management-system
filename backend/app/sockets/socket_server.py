import socketio
import json
import redis
import os

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
    ]
)

# Track subscribed clients
_subscriptions = {}  # vehicle_id -> set of sids


def _get_redis():
    """Get Redis client for live data."""
    try:
        redis_url = os.environ.get("REDIS_URL", "redis://127.0.0.1:6380/0")
        client = redis.from_url(redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


@sio.event
async def connect(sid, environ):
    print(f'[Socket] Client connected: {sid}')


@sio.event
async def disconnect(sid):
    print(f'[Socket] Client disconnected: {sid}')
    # Clean up subscriptions
    for vehicle_id in list(_subscriptions.keys()):
        if sid in _subscriptions[vehicle_id]:
            _subscriptions[vehicle_id].discard(sid)
            if not _subscriptions[vehicle_id]:
                del _subscriptions[vehicle_id]


@sio.event
async def subscribe_vehicle(sid, vehicle_id):
    """Subscribe to live updates for a vehicle."""
    if vehicle_id not in _subscriptions:
        _subscriptions[vehicle_id] = set()
    _subscriptions[vehicle_id].add(sid)
    
    # Send current location immediately
    redis_client = _get_redis()
    if redis_client:
        try:
            location_data = redis_client.get(f'vehicle:{vehicle_id}:location')
            if location_data:
                await sio.emit('vehicle_location', {
                    'vehicle_id': vehicle_id,
                    'data': json.loads(location_data)
                }, to=sid)
        except Exception as e:
            print(f'[Socket] Failed to send initial location: {e}')
    
    print(f'[Socket] {sid} subscribed to vehicle {vehicle_id}')


@sio.event
async def unsubscribe_vehicle(sid, vehicle_id):
    """Unsubscribe from vehicle updates."""
    if vehicle_id in _subscriptions:
        _subscriptions[vehicle_id].discard(sid)
        if not _subscriptions[vehicle_id]:
            del _subscriptions[vehicle_id]
    print(f'[Socket] {sid} unsubscribed from vehicle {vehicle_id}')


async def emit_vehicle_update(vehicle_id: str, location_data: dict):
    """Emit vehicle location update to all subscribed clients."""
    if vehicle_id in _subscriptions:
        await sio.emit('vehicle_location', {
            'vehicle_id': vehicle_id,
            'data': location_data
        }, to=list(_subscriptions[vehicle_id]))


async def emit_alert(alert_data: dict):
    """Broadcast alert to all connected clients."""
    await sio.emit('alert_created', alert_data)


async def emit_notification(notification_data: dict):
    """Broadcast notification to all connected clients."""
    await sio.emit('notification', notification_data)