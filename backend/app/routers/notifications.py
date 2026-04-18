from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
import os, json, redis as redis_lib

router = APIRouter()


def _r():
    url = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
    return redis_lib.from_url(url, decode_responses=True)


@router.get('')
def get_notifications(user=Depends(get_current_user)):
    try:
        r = _r()
        raw = r.lrange('notifications', 0, 29)
        return [json.loads(n) for n in raw]
    except Exception:
        return []


@router.post('/read')
def mark_all_read(user=Depends(get_current_user)):
    try:
        r = _r()
        notifs = r.lrange('notifications', 0, 49)
        r.delete('notifications')
        updated = []
        for n in notifs:
            data = json.loads(n)
            data['read'] = True
            updated.append(json.dumps(data))
        if updated:
            r.rpush('notifications', *updated)
        return {'marked': len(updated)}
    except Exception as e:
        return {'error': str(e)}