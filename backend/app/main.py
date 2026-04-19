import asyncio
import subprocess
import sys
import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

from app.config import settings as app_settings
from app.routers import health, vehicles, alerts, analytics, agent, auth, maintenance, profile, fuel
from app.routers import settings as settings_router
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers import tasks as tasks_router
from app.routers import notifications as notifications_router
from app.routers import contact as contact_router

security = HTTPBearer()

app = FastAPI(
    title="FleetPulse API",
    description="Real-Time Fleet Intelligence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        app_settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(agent.router, prefix="/agent", tags=["agent"])
app.include_router(settings_router.router, prefix="/settings", tags=["settings"])
app.include_router(auth.router)
app.include_router(maintenance.router)
app.include_router(tasks_router.router, prefix='/tasks', tags=['tasks'])
app.include_router(notifications_router.router, prefix='/notifications', tags=['notifications'])
app.include_router(contact_router.router, prefix='/contact', tags=['contact'])
app.include_router(profile.router, tags=["profile"])
app.include_router(fuel.router, tags=["fuel"])

socket_app = app

_simulator_proc = None

def start_simulator():
    global _simulator_proc
    project_root = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    simulator_path = os.path.join(project_root, 'simulator', 'gps_simulator.py')

    if not os.path.exists(simulator_path):
        print(f'[Simulator] Not found at {simulator_path}')
        return

    kwargs = {}
    if sys.platform == 'win32':
        kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW

    env = os.environ.copy()
    env['REDIS_URL'] = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6380/0')
    env['PYTHONPATH'] = project_root

    _simulator_proc = subprocess.Popen(
        [sys.executable, simulator_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
        cwd=project_root,
        **kwargs
    )
    print(f'[Simulator] Started PID {_simulator_proc.pid}')


def auto_seed_if_empty():
    """Seed vehicles, drivers, and tasks if DynamoDB tables are empty (LocalStack data loss guard)."""
    try:
        import json, boto3, redis as redis_lib, uuid
        from datetime import datetime
        from decimal import Decimal

        db = boto3.resource(
            'dynamodb',
            endpoint_url=os.environ.get('LOCALSTACK_ENDPOINT', 'http://localstack:4566'),
            region_name='ap-south-1',
            aws_access_key_id='test', aws_secret_access_key='test',
        )
        vt = db.Table('Vehicles')
        if vt.scan(Select='COUNT')['Count'] > 0:
            return  # data is already there

        print('[Seed] Vehicles table is empty — auto-seeding...')
        r = redis_lib.from_url(os.environ.get('REDIS_URL', 'redis://redis:6379/0'), decode_responses=True)
        now = datetime.utcnow().isoformat()

        VEHICLES = [
            ('vehicle-1',  'TN01AB1001', 'Truck', 'driver-1',  100, 11.0168, 76.9558, 'Gandhipuram Bus Stand', 'Coimbatore Airport'),
            ('vehicle-2',  'TN01AB1002', 'Van',   'driver-2',   80, 10.9987, 76.9508, 'RS Puram',              'Peelamedu'),
            ('vehicle-3',  'TN01AB1003', 'Truck', 'driver-3',  100, 10.9847, 76.9762, 'Ukkadam',               'Singanallur'),
            ('vehicle-4',  'TN01AB1004', 'Van',   'driver-4',   80, 11.0130, 77.0180, 'Tidel Park',            'Podanur Junction'),
            ('vehicle-5',  'TN01AB1005', 'Truck', 'driver-5',  100, 11.0080, 76.9720, 'Saibaba Colony',        'Ganapathy'),
            ('vehicle-6',  'TN01AB1006', 'Van',   'driver-6',   80, 11.0050, 76.9650, 'Race Course',           'Vadavalli'),
            ('vehicle-7',  'TN01AB1007', 'Truck', 'driver-7',  100, 11.0200, 76.9600, 'Hopes College',         'Kuniyamuthur'),
            ('vehicle-8',  'TN01AB1008', 'Van',   'driver-8',   80, 10.9500, 76.9650, 'Kovaipudur',            'Thondamuthur'),
            ('vehicle-9',  'TN01AB1009', 'Truck', 'driver-9',  100, 11.0330, 77.1200, 'Sulur',                 'Kaniyur'),
            ('vehicle-10', 'TN01AB1010', 'Van',   'driver-10',  80, 11.0400, 76.9700, 'Mettupalayam Road',     'Avinashi Road'),
        ]
        DRIVER_NAMES = [
            ('Driver Arjun Kumar',    '9876543201', 'arjun@fleet.com'),
            ('Driver Priya Sharma',   '9876543202', 'priya@fleet.com'),
            ('Driver Ravi Patel',     '9876543203', 'ravi@fleet.com'),
            ('Driver Meena Das',      '9876543204', 'meena@fleet.com'),
            ('Driver Suresh Nair',    '9876543205', 'suresh@fleet.com'),
            ('Driver Kiran Reddy',    '9876543206', 'kiran@fleet.com'),
            ('Driver Anjali Singh',   '9876543207', 'anjali@fleet.com'),
            ('Driver Deepak Raj',     '9876543208', 'deepak@fleet.com'),
            ('Driver Pooja Menon',    '9876543209', 'pooja@fleet.com'),
            ('Driver Vijay Krishnan', '9876543210', 'vijay@fleet.com'),
        ]

        dt = db.Table('Drivers')
        tt = db.Table('Tasks')

        for vid, reg, vtype, driver, cap, lat, lon, src, dst in VEHICLES:
            vt.put_item(Item={
                'vehicle_id': vid, 'registration': reg, 'type': vtype,
                'driver_id': driver, 'fuel_capacity': cap,
                'latitude': str(lat), 'longitude': str(lon),
                'speed': 0, 'fuel_level': 80, 'status': 'idle', 'last_updated': now,
            })
            # Only seed Redis location if key is missing
            key = f'vehicle:{vid}:location'
            if not r.exists(key):
                r.setex(key, 86400, json.dumps({
                    'latitude': lat, 'longitude': lon, 'speed': 0, 'fuel_level': 80,
                    'status': 'idle', 'timestamp': now, 'source': src, 'dest': dst,
                    'progress': 0, 'odometer': 0, 'driver_fatigue': 0,
                }))

        for i, (name, phone, email) in enumerate(DRIVER_NAMES, 1):
            dt.put_item(Item={
                'driver_id': f'driver-{i}', 'name': name, 'phone': phone, 'email': email,
                'status': 'active', 'license_number': f'TN{i:08d}',
                'safety_score': 85, 'created_at': now,
            })

        # Seed tasks for all 10 vehicles — CRITICAL for simulator to work
        task_count = 0
        for i, (vid, reg, vtype, driver, cap, lat, lon, src, dst) in enumerate(VEHICLES, 1):
            task_id = str(uuid.uuid4())
            tt.put_item(Item={
                'task_id': task_id,
                'vehicle_id': vid,
                'driver_id': driver,
                'source': src,
                'dest': dst,
                'start_coords': [Decimal(str(lat)), Decimal(str(lon))],
                'end_coords': [Decimal(str(10.9500 + i*0.001)), Decimal(str(76.9650 + i*0.001))],
                'status': 'active',
                'priority': 'medium',
                'created_at': now,
            })
            task_count += 1

        print(f'[Seed] Auto-seed complete — 10 vehicles, 10 drivers, {task_count} tasks added')
    except Exception as e:
        print(f'[Seed] Auto-seed failed (non-fatal): {e}')


@app.on_event('startup')
async def startup():
    auto_seed_if_empty()
    start_simulator()
