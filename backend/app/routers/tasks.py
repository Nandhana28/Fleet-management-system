from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_current_user
from app.db.dynamodb import get_table
import uuid
from datetime import datetime
from decimal import Decimal

router = APIRouter()

LANDMARKS = [
    'Gandhipuram Bus Stand', 'Coimbatore Airport', 'RS Puram', 'Peelamedu',
    'Ukkadam', 'Singanallur', 'Tidel Park', 'Podanur Junction',
    'Saibaba Colony', 'Ganapathy', 'Race Course', 'Vadavalli',
    'Hopes College', 'Kuniyamuthur', 'Kovaipudur', 'Thondamuthur',
    'Sulur', 'Kaniyur', 'Mettupalayam Road', 'Avinashi Road',
    'Town Hall', 'CODISSIA', 'Brookefields Mall', 'Prozone Mall',
    'Coimbatore Junction',
]

LANDMARK_COORDS = {
    'Gandhipuram Bus Stand':  [11.0168, 76.9558],
    'Coimbatore Airport':     [11.0275, 77.0434],
    'RS Puram':               [10.9987, 76.9617],   # was 76.9508 — too far west
    'Peelamedu':              [11.0167, 77.0081],
    'Ukkadam':                [10.9847, 76.9762],
    'Singanallur':            [11.0009, 77.0289],
    'Tidel Park':             [11.0130, 77.0147],
    'Podanur Junction':       [10.9704, 76.9605],   # was 76.9785 — wrong side of city
    'Saibaba Colony':         [11.0110, 76.9676],   # was 11.0080, 76.9720
    'Ganapathy':              [11.0228, 76.9632],
    'Race Course':            [11.0057, 76.9636],
    'Vadavalli':              [11.0236, 76.8929],   # was 11.0150, 76.9050 — too far east
    'Hopes College':          [11.0168, 76.9543],   # was 11.0200, 76.9600
    'Kuniyamuthur':           [10.9580, 76.9740],
    'Kovaipudur':             [10.9467, 76.9512],   # was 10.9500, 76.9650
    'Thondamuthur':           [10.9748, 76.8711],   # SW of Coimbatore on Anaimalai road
    'Sulur':                  [11.0302, 77.1200],
    'Kaniyur':                [11.0390, 77.0560],
    'Mettupalayam Road':      [11.0600, 76.9380],   # was 11.0400, 76.9700
    'Avinashi Road':          [11.0458, 77.0189],   # was 11.0350, 77.0400
    'Town Hall':              [11.0024, 76.9660],
    'CODISSIA':               [11.0302, 77.0327],
    'Brookefields Mall':      [11.0205, 77.0059],
    'Prozone Mall':           [11.0152, 77.0147],
    'Coimbatore Junction':    [11.0021, 76.9689],
}


class TaskCreate(BaseModel):
    vehicle_id: str
    driver_id: str
    source: str
    dest: str
    priority: Optional[str] = 'medium'
    notes: Optional[str] = ''


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get('/landmarks')
def get_landmarks(user=Depends(get_current_user)):
    return {'landmarks': LANDMARKS, 'coords': LANDMARK_COORDS}


@router.get('')
def list_tasks(user=Depends(get_current_user)):
    table = get_table('Tasks')
    resp = table.scan()
    tasks = resp.get('Items', [])
    # Convert Decimal coords
    for t in tasks:
        if 'start_coords' in t:
            t['start_coords'] = [float(c) for c in t['start_coords']]
        if 'end_coords' in t:
            t['end_coords'] = [float(c) for c in t['end_coords']]
    return {"tasks": sorted(tasks, key=lambda x: x.get('created_at', ''), reverse=True)}


@router.post('')
def create_task(req: TaskCreate, user=Depends(get_current_user)):
    if req.source not in LANDMARK_COORDS:
        raise HTTPException(status_code=400, detail=f'Unknown source: {req.source}')
    if req.dest not in LANDMARK_COORDS:
        raise HTTPException(status_code=400, detail=f'Unknown destination: {req.dest}')
    # Allow source == dest for return-to-source trips (SOS recovery)
    # if req.source == req.dest:
    #     raise HTTPException(status_code=400, detail='Source and destination cannot be the same')

    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    start = LANDMARK_COORDS[req.source]
    end   = LANDMARK_COORDS[req.dest]

    table = get_table('Tasks')
    item = {
        'task_id':    task_id,
        'vehicle_id': req.vehicle_id,
        'driver_id':  req.driver_id,
        'source':     req.source,
        'dest':       req.dest,
        'start_coords': [Decimal(str(c)) for c in start],
        'end_coords':   [Decimal(str(c)) for c in end],
        'status':     'active',
        'priority':   req.priority,
        'notes':      req.notes,
        'created_at': now,
        'assigned_at': now,
    }
    table.put_item(Item=item)

    # Push task to Redis so simulator picks it up immediately
    import os, json, redis as redis_lib
    try:
        redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
        r = redis_lib.from_url(redis_url, decode_responses=True)
        r.set(f'task:{req.vehicle_id}:active', json.dumps({
            'task_id':    task_id,
            'vehicle_id': req.vehicle_id,
            'driver_id':  req.driver_id,
            'source':     req.source,
            'dest':       req.dest,
            'start_coords': start,
            'end_coords':   end,
            'priority':   req.priority,
        }))
    except Exception as e:
        print(f'[Task] Redis push failed: {e}')

    return {**item, 'start_coords': start, 'end_coords': end}


@router.patch('/{task_id}')
def update_task(task_id: str, req: TaskUpdate, user=Depends(get_current_user)):
    table = get_table('Tasks')
    updates = {}
    if req.status:
        updates['#s'] = req.status
    if req.notes is not None:
        updates['notes'] = req.notes

    if not updates:
        raise HTTPException(status_code=400, detail='Nothing to update')

    expr = 'SET ' + ', '.join(
        f'#s = :s' if k == '#s' else f'{k} = :{k}' for k in updates
    )
    attr_names = {'#s': 'status'} if '#s' in updates else {}
    attr_vals  = {f':{k}': v for k, v in updates.items()}

    resp = table.update_item(
        Key={'task_id': task_id},
        UpdateExpression=expr,
        ExpressionAttributeNames=attr_names if attr_names else None,
        ExpressionAttributeValues=attr_vals,
        ReturnValues='ALL_NEW',
    )
    item = resp.get('Attributes', {})
    if 'start_coords' in item:
        item['start_coords'] = [float(c) for c in item['start_coords']]
    if 'end_coords' in item:
        item['end_coords'] = [float(c) for c in item['end_coords']]
    return item


@router.delete('/{task_id}')
def delete_task(task_id: str, user=Depends(get_current_user)):
    table = get_table('Tasks')
    # Get task first to clear Redis
    resp = table.get_item(Key={'task_id': task_id})
    item = resp.get('Item', {})

    table.delete_item(Key={'task_id': task_id})

    # Clear from Redis
    if item.get('vehicle_id'):
        import os, redis as redis_lib
        try:
            redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
            r = redis_lib.from_url(redis_url, decode_responses=True)
            r.delete(f"task:{item['vehicle_id']}:active")
        except Exception:
            pass

    return {'deleted': task_id}


@router.get('/active')
def get_active_tasks(user=Depends(get_current_user)):
    """Get all active tasks — used by simulator on startup."""
    table = get_table('Tasks')
    resp = table.scan()
    tasks = [t for t in resp.get('Items', []) if t.get('status') == 'active']
    for t in tasks:
        if 'start_coords' in t:
            t['start_coords'] = [float(c) for c in t['start_coords']]
        if 'end_coords' in t:
            t['end_coords'] = [float(c) for c in t['end_coords']]
    return tasks