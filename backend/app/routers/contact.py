from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import json
import time

router = APIRouter()


class ContactMessage(BaseModel):
    name: str
    email: str
    message: str


def _r():
    try:
        import os, redis as redis_lib
        url = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
        return redis_lib.from_url(url, decode_responses=True)
    except Exception:
        return None


@router.post('')
def submit_contact(payload: ContactMessage):
    if not payload.name.strip() or not payload.email.strip() or not payload.message.strip():
        raise HTTPException(status_code=400, detail='All fields are required')

    entry = {
        'name': payload.name.strip(),
        'email': payload.email.strip(),
        'message': payload.message.strip(),
        'submitted_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    }

    r = _r()
    if r:
        try:
            r.lpush('contact:messages', json.dumps(entry))
            r.ltrim('contact:messages', 0, 499)
        except Exception:
            pass

    return {'ok': True, 'message': "Thanks! We'll get back to you within 24 hours."}
