# FleetPulse — Complete Project Knowledge Base

## Project Overview

**FleetPulse** is a real-time fleet management and intelligence platform built for logistics businesses in Tamil Nadu, India. It tracks 10+ vehicles in real-time, detects anomalies (fuel theft, overspeeding, route deviation), sends alerts via WhatsApp/SMS/Email, and provides an AI agent for fleet queries.

**Team:** 2 developers, 4 weeks, 100% free tier AWS, enterprise-scale architecture

---

## Architecture Overview

```
GPS Simulator (10 vehicles, Coimbatore)
        ↓
AWS IoT Core (MQTT)
        ↓
Kinesis Data Stream (real-time GPS pipeline)
        ↓
Lambda (Python) → ML Anomaly Detection (Isolation Forest)
        ↓
DynamoDB (Vehicles, Trips, Alerts, Drivers, AgentConfig tables)
        ↓
Redis Cache (vehicle locations, TTL 60s)
        ↓
FastAPI Backend (REST API + Socket.io WebSocket)
        ↓
React Dashboard (Leaflet map, Chart.js analytics, Tailwind CSS)
        ↓
Agentic AI (LangChain + LangGraph + Claude API)
        ↓
SNS → Twilio (WhatsApp/SMS) + AWS SES (Email)
        ↓
Prometheus + Grafana + Loki (monitoring)
        ↓
GitHub Actions → DockerHub → ArgoCD → AWS EKS (Kubernetes)
```

---

## Tech Stack

### Backend (Nandhana)
- **Framework:** FastAPI (Python 3.11)
- **Database:** DynamoDB (AWS)
- **Cache:** Redis
- **Task Queue:** Celery + Redis broker
- **Real-time:** Socket.io (python-socketio)
- **Auth:** JWT + Google OAuth
- **Monitoring:** Prometheus metrics
- **Testing:** Pytest

### Frontend (Nandhana)
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS
- **Maps:** Leaflet.js + react-leaflet
- **Charts:** Chart.js + react-chartjs-2
- **State:** Zustand
- **HTTP:** Axios + React Query
- **Real-time:** Socket.io client
- **Voice:** Web Speech API

### Infrastructure (Farhana)
- **IaC:** Terraform + Terragrunt
- **Cloud:** AWS (ap-south-1 Mumbai region)
- **Container:** Docker + Docker Compose
- **Orchestration:** Kubernetes (EKS) + Helm
- **CI/CD:** GitHub Actions + ArgoCD
- **Monitoring:** Prometheus + Grafana + Loki
- **ML:** Scikit-learn (Isolation Forest)
- **Simulator:** Python + Paho MQTT

---

## AWS Services Used

| Service | Resource | Purpose |
|---|---|---|
| **DynamoDB** | Vehicles, Trips, Alerts, Drivers, AgentConfig | Primary database |
| **Kinesis** | fleetpulse-gps-stream | Real-time GPS data pipeline |
| **Lambda** | 3 functions (gps_processor, alert_dispatcher, report_generator) | Serverless processing |
| **IoT Core** | 10 vehicle Things + policy | MQTT broker for GPS data |
| **SNS** | fleetpulse-alerts topic | Alert distribution |
| **SES** | Email sending | Email notifications |
| **S3** | Terraform state + reports | Storage |
| **ECR** | Docker image registry | Container images |
| **EKS** | Kubernetes cluster | Production deployment |
| **Secrets Manager** | Twilio, Google OAuth creds | Secure credential storage |

---

## Project Structure

```
Fleet-management-system/
├── .github/workflows/          [CI/CD pipelines]
├── docs/                       [Shared contracts - CRITICAL]
│   ├── data-models.md         [DynamoDB table schemas]
│   ├── api-contracts.md       [API endpoint shapes]
│   ├── redis-keys.md          [Redis key formats]
│   └── event-schemas.md       [MQTT/Kinesis payload shapes]
├── shared/                     [Shared Python code]
│   ├── constants.py           [Table names, key templates, ARNs]
│   ├── schemas.py             [Pydantic models: Vehicle, Trip, Alert, Driver]
│   └── exceptions.py          [Common exceptions]
├── simulator/                  [GPS simulator - Farhana]
│   └── gps_simulator.py       [10 vehicles, MQTT, chaos mode]
├── infra/                      [AWS infrastructure - Farhana]
│   ├── terraform/             [All AWS resources]
│   ├── helm-charts/           [Kubernetes deployment]
│   └── argocd/                [GitOps deployment]
├── pipeline/                   [Data pipeline - Farhana]
│   ├── kinesis_consumer/      [Kinesis → Lambda]
│   └── lambda_functions/      [3 Lambda functions]
├── ml/                         [ML models - Farhana]
│   └── anomaly_detection/     [Isolation Forest]
├── monitoring/                 [Prometheus + Grafana - Farhana]
├── agent/                      [AI agent - Farhana builds logic, Nandhana builds UI]
│   ├── tools.py               [LangChain tool implementations - Farhana]
│   ├── fleet_agent.py         [LangGraph state machine - Farhana]
│   ├── prompts.py             [System prompt + few-shot examples - Nandhana]
│   └── tool_schemas.py        [Tool descriptions for Claude - Nandhana]
├── backend/                    [FastAPI - Nandhana]
│   ├── app/
│   │   ├── main.py            [FastAPI app init]
│   │   ├── config.py          [Pydantic Settings]
│   │   ├── routers/           [API endpoints]
│   │   ├── services/          [Business logic]
│   │   ├── db/                [DynamoDB operations]
│   │   ├── websocket/         [Socket.io]
│   │   └── middleware/        [Auth, CORS, logging]
│   ├── tasks/                 [Celery tasks]
│   └── tests/                 [Pytest tests]
├── frontend/                   [React - Nandhana]
│   ├── src/
│   │   ├── pages/             [Dashboard, Analytics, Agent, Settings]
│   │   ├── components/        [Map, Charts, Agent UI, Alerts]
│   │   ├── hooks/             [useVehicles, useSocket, useAgentStream]
│   │   ├── services/          [API clients]
│   │   ├── types/             [TypeScript interfaces]
│   │   └── store/             [Zustand state]
│   └── Dockerfile             [Multi-stage build]
├── docker-compose.yml         [Local dev - all services]
├── docker-compose.test.yml    [CI testing]
├── Makefile                   [Shortcuts]
└── README.md                  [Project overview]
```

---

## Docker Compose Services

**File:** `docker-compose.yml`

| Service | Port | Purpose |
|---|---|---|
| **fastapi** | 8000 | FastAPI backend |
| **celery-worker** | - | Background task processor |
| **celery-beat** | - | Task scheduler |
| **redis** | 6379 | Cache + Celery broker |
| **localstack** | 4566 | Fake AWS (DynamoDB, S3, SNS, SQS, Lambda, Kinesis) |
| **prometheus** | 9090 | Metrics collection |
| **grafana** | 3001 | Dashboards (admin/fleetpulse123) |

**Environment Variables:**
- `USE_LOCALSTACK=true` (dev) or `false` (prod AWS)
- `LOCALSTACK_ENDPOINT=http://localstack:4566`
- `REDIS_URL=redis://redis:6379/0`
- `CELERY_BROKER_URL=redis://redis:6379/1`

---

## How to Run Locally

### Terminal 1: Backend (Docker)
```bash
docker-compose up
```
Starts all services: FastAPI (8000), Redis, LocalStack, Celery, Prometheus, Grafana

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
React dev server at http://localhost:5173

### Terminal 3: GPS Simulator (Optional)
```bash
make sim
```
Simulates 10 vehicles sending GPS data to IoT Core

### Verify Everything
```bash
make health
```
Checks if FastAPI backend is healthy

---

## Key Endpoints

### Health & Metrics
- `GET /health` — Backend health check
- `GET /metrics` — Prometheus metrics

### Vehicles
- `GET /vehicles` — List all vehicles (reads Redis cache first)
- `GET /vehicles/{id}` — Vehicle details
- `POST /vehicles/{id}/location` — Update location (writes Redis + DynamoDB)

### Alerts
- `GET /alerts` — List all alerts
- `POST /alerts` — Create alert
- `PATCH /alerts/{id}` — Resolve alert

### Analytics
- `GET /analytics/fuel` — Fuel consumption by vehicle
- `GET /analytics/km` — Distance traveled by vehicle
- `GET /analytics/anomalies` — Anomaly statistics

### Agent
- `POST /agent` — Send query to AI agent (streaming response)
- `GET /agent/tools` — List available tools

### Settings
- `GET /settings` — User settings
- `POST /settings` — Update settings (WhatsApp, email, alert thresholds)

---

## Database Schema (DynamoDB)

### Vehicles Table
```
PK: vehicle_id (String)
SK: metadata (String)
Attributes:
  - vehicle_id: String
  - driver_id: String
  - registration_number: String (TN-33-XX-XXXX)
  - vehicle_type: String (truck, van, bike)
  - fuel_capacity: Number
  - current_location: {lat, lng}
  - status: String (active, inactive, maintenance)
  - created_at: Number (timestamp)
```

### Trips Table
```
PK: trip_id (String)
SK: vehicle_id (String)
Attributes:
  - trip_id: String
  - vehicle_id: String
  - driver_id: String
  - start_location: {lat, lng}
  - end_location: {lat, lng}
  - distance_km: Number
  - fuel_used: Number
  - duration_minutes: Number
  - start_time: Number (timestamp)
  - end_time: Number (timestamp)
  - status: String (ongoing, completed, cancelled)
```

### Alerts Table
```
PK: alert_id (String)
SK: created_at (Number)
Attributes:
  - alert_id: String
  - vehicle_id: String
  - alert_type: String (fuel_theft, overspeeding, route_deviation, offline)
  - severity: String (low, medium, high, critical)
  - message: String
  - location: {lat, lng}
  - created_at: Number (timestamp)
  - resolved_at: Number (timestamp, optional)
  - resolved_by: String (user_id, optional)
```

### Drivers Table
```
PK: driver_id (String)
SK: metadata (String)
Attributes:
  - driver_id: String
  - name: String
  - phone: String
  - email: String
  - license_number: String
  - license_expiry: Number (timestamp)
  - total_trips: Number
  - total_km: Number
  - safety_score: Number (0-100)
  - created_at: Number (timestamp)
```

### AgentConfig Table
```
PK: user_id (String)
SK: config_type (String)
Attributes:
  - user_id: String
  - whatsapp_number: String
  - email: String
  - alert_fuel_theft: Boolean
  - alert_overspeeding: Boolean
  - alert_geofence: Boolean
  - max_speed_kmh: Number
  - geofence_radius_km: Number
  - min_fuel_warning_percent: Number
  - updated_at: Number (timestamp)
```

---

## Redis Key Formats

All keys defined in `shared/constants.py`:

```python
# Vehicle locations (TTL 60s)
VEHICLE_LOCATION_KEY = "vehicle:{vehicle_id}:location"
# Value: {"lat": 11.0168, "lng": 76.9558, "speed": 45, "fuel": 75}

# Vehicle status (TTL 300s)
VEHICLE_STATUS_KEY = "vehicle:{vehicle_id}:status"
# Value: {"status": "active", "last_update": 1234567890}

# User settings cache (TTL 3600s)
USER_SETTINGS_KEY = "user:{user_id}:settings"
# Value: JSON of AgentConfig

# Agent conversation memory (TTL 3600s)
AGENT_MEMORY_KEY = "agent:memory:{user_id}"
# Value: List of last 10 conversation turns
```

---

## API Request/Response Examples

### Get All Vehicles
```bash
GET /vehicles
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "vehicles": [
    {
      "vehicle_id": "VH001",
      "registration_number": "TN-33-AB-1234",
      "driver_id": "DR001",
      "current_location": {"lat": 11.0168, "lng": 76.9558},
      "speed": 45,
      "fuel_percent": 75,
      "status": "active",
      "last_update": 1234567890
    }
  ]
}
```

### Create Alert
```bash
POST /alerts
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "vehicle_id": "VH001",
  "alert_type": "fuel_theft",
  "severity": "high",
  "message": "Fuel dropped 20% in 5 minutes",
  "location": {"lat": 11.0168, "lng": 76.9558}
}

Response:
{
  "alert_id": "AL001",
  "created_at": 1234567890,
  "status": "created"
}
```

### Agent Query (Streaming)
```bash
POST /agent
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "query": "Which vehicle has the lowest fuel?",
  "user_id": "USER001"
}

Response: (Server-Sent Events stream)
data: {"type": "text", "content": "Checking vehicle database..."}
data: {"type": "tool_call", "tool": "query_vehicle_location", "status": "running"}
data: {"type": "tool_result", "result": "VH003 has 15% fuel"}
data: {"type": "text", "content": "Vehicle VH003 (TN-33-CD-5678) has the lowest fuel at 15%..."}
```

---

## Authentication Flow

1. **Login:** `POST /auth/login` with email + password
2. **Google OAuth:** `GET /auth/google` → redirects to Google → callback → JWT
3. **JWT Token:** Returned in response, stored in localStorage
4. **API Calls:** Include `Authorization: Bearer <JWT_TOKEN>` header
5. **Token Refresh:** `POST /auth/refresh` with refresh token

JWT Secret: `settings.jwt_secret_key` (from .env)
Algorithm: HS256
Expiry: 24 hours (configurable)

---

## Anomaly Detection

**Model:** Isolation Forest (Scikit-learn)
**Features:**
- Speed delta (current - previous)
- Fuel rate (fuel consumed per km)
- Heading change (degrees)
- Distance from expected route

**Anomaly Types:**
1. **Fuel Theft:** >15% fuel drop in 5 minutes
2. **Overspeeding:** Speed > max_speed_kmh for >2 minutes
3. **Route Deviation:** >2km from expected route
4. **Offline:** No GPS update for >10 minutes

**Alert Flow:**
1. Lambda receives GPS from Kinesis
2. ML model predicts anomaly score
3. If score > threshold → write Alert to DynamoDB
4. DynamoDB Stream triggers Lambda alert_dispatcher
5. alert_dispatcher publishes to SNS
6. SNS triggers Twilio → WhatsApp/SMS to driver + fleet owner

---

## Celery Tasks

### Daily Report Generation
```python
@celery_app.task
def generate_daily_report():
    # Aggregate DynamoDB data for last 24h
    # Generate PDF with fuel, km, anomalies
    # Upload to S3
    # Send via SES email
    # Scheduled: 11 PM daily via celery-beat
```

### Batch Alert Notifications
```python
@celery_app.task
def batch_unresolved_alerts():
    # Find unresolved alerts older than 1 hour
    # Re-notify via WhatsApp/SMS
    # Scheduled: Every 5 minutes via celery-beat
```

---

## Socket.io Events

**Server → Client:**
- `vehicle_update` — Vehicle location/status changed
- `alert_created` — New alert
- `alert_resolved` — Alert marked resolved
- `connection` — Client connected

**Client → Server:**
- `subscribe_vehicle` — Subscribe to vehicle updates
- `unsubscribe_vehicle` — Unsubscribe
- `agent_query` — Send query to AI agent

---

## Environment Variables (.env)

```bash
# AWS
USE_LOCALSTACK=true
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=ap-south-1
LOCALSTACK_ENDPOINT=http://localstack:4566

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Twilio (WhatsApp/SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_VERIFY_SERVICE_SID=your-service-sid

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:5173

# Claude API (for agent)
ANTHROPIC_API_KEY=your-api-key
```

---

## Deployment

### Local Development
```bash
docker-compose up
```

### Production (AWS EKS)
1. Farhana provisions EKS cluster with Terraform
2. GitHub Actions builds Docker images → pushes to ECR
3. Helm chart updated with new image tags
4. ArgoCD detects change → deploys to EKS
5. Prometheus + Grafana monitor health

### Scaling
- **FastAPI:** HPA scales 2-5 replicas based on CPU/memory
- **Celery:** Manual scaling via Kubernetes replicas
- **DynamoDB:** On-demand billing (auto-scales)
- **Redis:** ElastiCache cluster (multi-AZ)

---

## Monitoring & Observability

### Prometheus Metrics
- `fastapi_requests_total` — Total API requests
- `fastapi_request_duration_seconds` — Request latency
- `celery_task_duration_seconds` — Task execution time
- `dynamodb_query_duration_seconds` — DB query latency
- `redis_operation_duration_seconds` — Cache operation latency

### Grafana Dashboards
1. **Fleet Overview** — Vehicle count, active trips, anomalies
2. **Pipeline Health** — Kinesis throughput, Lambda errors, DynamoDB throttling
3. **API Performance** — Request rate, latency, error rate
4. **Infrastructure** — CPU, memory, disk, network

### Loki Logs
- All container logs aggregated
- Searchable by service, level, vehicle_id, user_id
- Retention: 30 days

---

## Testing

### Backend Tests
```bash
pytest backend/tests/ -v
```

### Frontend Tests
```bash
npm run test
```

### Integration Tests
- Full flow: GPS Simulator → Kinesis → Lambda → DynamoDB → Redis → FastAPI → React
- Load test: 500 VUs, 60s, measure latency + throughput

---

## Common Issues & Fixes

### LocalStack DynamoDB not connecting
```bash
# Check LocalStack is running
docker-compose logs localstack

# Verify endpoint
curl http://localhost:4566/_localstack/health
```

### Redis connection refused
```bash
# Check Redis is running
docker-compose logs redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

### FastAPI not starting
```bash
# Check logs
docker-compose logs fastapi

# Verify .env file exists
ls -la .env
```

### Frontend can't reach backend
```bash
# Check CORS is enabled in FastAPI
# Check frontend .env has correct API_URL
# Verify backend is running on 8000
curl http://localhost:8000/health
```

---

## Key Files to Know

| File | Purpose | Owner |
|---|---|---|
| `docker-compose.yml` | Local dev environment | Nandhana |
| `shared/constants.py` | Shared constants (table names, key formats) | Both |
| `backend/app/main.py` | FastAPI app entry point | Nandhana |
| `backend/app/config.py` | Environment configuration | Nandhana |
| `backend/app/db/dynamodb.py` | DynamoDB client init | Nandhana |
| `backend/app/services/cache_service.py` | Redis operations | Nandhana |
| `frontend/src/App.tsx` | React app entry point | Nandhana |
| `frontend/src/components/map/FleetMap.tsx` | Leaflet map component | Nandhana |
| `agent/tools.py` | LangChain tool implementations | Farhana |
| `agent/prompts.py` | Claude system prompt | Nandhana |
| `simulator/gps_simulator.py` | GPS data generator | Farhana |
| `infra/terraform/dynamodb.tf` | DynamoDB infrastructure | Farhana |

---

## Integration Checkpoints

| Week | Farhana Delivers | Nandhana Delivers |
|---|---|---|
| 1 | Terraform provisioned DynamoDB + IoT Core | Working docker-compose with LocalStack |
| 2 | Lambda writing Redis with correct key format | FastAPI cache_service reading Redis |
| 3 | tools.py + fleet_agent.py | prompts.py + tool_schemas.py + Agent UI |
| 4 | Docker images deployed to EKS | Final Dockerfiles pushed to DockerHub |

---

## Quick Reference Commands

```bash
# Start everything
docker-compose up

# View logs
docker-compose logs -f fastapi

# Run tests
pytest backend/tests/ -v

# Generate JWT
python scripts/generate_jwt.py

# Seed demo data
python scripts/seed_demo_data.py

# Run GPS simulator
python simulator/gps_simulator.py

# Check health
curl http://localhost:8000/health

# Access Grafana
http://localhost:3001 (admin/fleetpulse123)

# Access Prometheus
http://localhost:9090

# Access LocalStack
http://localhost:4566
```

---

## Notes for AI Assistants

1. **Always check `shared/constants.py`** before hardcoding table names or Redis keys
2. **DynamoDB operations** are in `backend/app/db/queries.py` — don't duplicate
3. **Cache operations** use Redis key formats from `shared/constants.py`
4. **API responses** must match shapes in `docs/api-contracts.md`
5. **Anomaly detection** thresholds are in `ml/anomaly_detection/thresholds.py`
6. **Frontend components** use Tailwind CSS — no inline styles
7. **All async operations** use `async/await` in FastAPI
8. **Socket.io events** are defined in `backend/app/websocket/events.py`
9. **Celery tasks** are in `backend/tasks/` — use `@celery_app.task` decorator
10. **Tests** use Pytest fixtures from `backend/tests/conftest.py`

