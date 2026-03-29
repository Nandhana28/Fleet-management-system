import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from datetime import datetime, timedelta
from jose import jwt
from app.config import settings

expire = datetime.utcnow() + timedelta(minutes=1440)
payload = {"sub": "fleet-owner", "exp": expire}
token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

print(f"\n{token}\n")
print("Paste this into Swagger → Authorize → value field")