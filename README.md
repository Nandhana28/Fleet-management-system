# FleetPulse

**Real-Time Fleet Intelligence Platform with Agentic AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Node 18+](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)

---

## Overview

FleetPulse is an enterprise-grade fleet management platform that combines real-time GPS tracking, anomaly detection, and agentic AI to provide actionable intelligence for fleet operations. The system processes streaming vehicle data, detects anomalies using ML models, and enables autonomous decision-making through LangChain agents.

**Key Features:**
- Real-time GPS tracking with Kinesis streaming
- ML-powered anomaly detection (Isolation Forest)
- Agentic AI for autonomous fleet management (LangChain + Claude)
- WebSocket-based live dashboard
- Multi-channel alerts (WhatsApp, Email, SMS)
- Comprehensive monitoring (Prometheus + Grafana + Loki)
- LocalStack for local AWS development
- Production-ready deployment on AWS EKS

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GPS Simulator (Python)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  AWS IoT Core / Kinesis Data Stream (Real-time GPS Pipeline)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────────┐  ┌──────────────┐
   │ Lambda  │    │ ML Anomaly   │  │ DynamoDB     │
   │ Consumer│    │ Detection    │  │ (Trips,      │
   └────┬────┘    └──────┬───────┘  │  Alerts,     │
        │                │          │  Vehicles)   │
        └────────────────┼──────────┘              │
                         │                        │
                         ▼                        │
        ┌────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI Backend + Redis Cache                      │
│  ├─ REST API (Vehicles, Trips, Alerts)                         │
│  ├─ WebSocket Server (Live Updates)                            │
│  ├─ Celery Workers (Async Tasks)                               │
│  └─ Agentic AI (LangChain + Claude)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────────┐
   │ React    │    │ Celery   │    │ SNS + Twilio │
   │ Dashboard│    │ Beat     │    │ (Alerts)     │
   │ (Leaflet)│    │ Scheduler│    │              │
   └──────────┘    └──────────┘    └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│         Monitoring Stack (Prometheus + Grafana + Loki)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Cloud & DevOps** | AWS (IoT Core, Kinesis, Lambda, DynamoDB, EKS), Terraform, Docker, Kubernetes, ArgoCD |
| **Backend** | FastAPI, Pydantic, Boto3, Redis, Celery, Socket.io |
| **Frontend** | React 18, TypeScript, Leaflet.js, Chart.js, TailwindCSS, Vite |
| **AI/ML** | LangChain, LangGraph, Claude API, Scikit-learn (Isolation Forest) |
| **Monitoring** | Prometheus, Grafana, Loki, OpenTelemetry |
| **Local Dev** | Docker Compose, LocalStack |

---

## Project Structure

```
Fleet-management-system/
├── .github/workflows/          # CI/CD pipelines (GitHub Actions)
├── docs/                       # Architecture & API documentation
├── infra/
│   ├── terraform/              # AWS infrastructure as code
│   └── helm-charts/            # Kubernetes deployment charts
├── monitoring/                 # Prometheus, Grafana, Loki configs
├── scripts/                    # Initialization & utility scripts
├── agent/                      # LangChain agent configurations
├── backend/                    # FastAPI REST API + Celery
├── frontend/                   # React dashboard
├── simulator/                  # GPS data simulator
├── pipeline/                   # Kinesis consumer + Lambda functions
├── ml/                         # Anomaly detection models
├── docker-compose.yml          # Local development orchestration
└── Makefile                    # Development shortcuts
```

---

## Quick Start

### Prerequisites

- Docker & Docker Compose 2.0+
- Python 3.11+ (for local development)
- Node 18+ (for frontend development)
- Git

### Local Development (LocalStack)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/Fleet-management-system.git
cd Fleet-management-system

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start all services
docker-compose up -d

# 4. Verify services are healthy
docker-compose ps
docker-compose logs -f backend

# 5. Access services
# Frontend:    http://localhost:3000
# Backend API: http://localhost:8000
# Grafana:     http://localhost:3001 (admin/fleetpulse123)
# Prometheus:  http://localhost:9090
# LocalStack:  http://localhost:4566
```

### Development Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run database migrations
docker-compose exec backend python -m alembic upgrade head

# Seed test data
docker-compose exec backend python seed-tasks.py

# Stop all services
docker-compose down

# Clean up volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Deployment

### LocalStack (Local AWS Emulation)

Perfect for development and testing. All AWS services run locally.

```bash
# Start LocalStack environment
docker-compose up -d

# Initialize AWS resources
docker-compose exec localstack bash /etc/localstack/init/ready.d/init-localstack.sh

# Verify resources
aws dynamodb list-tables --endpoint-url http://localhost:4566 --region ap-south-1
```

### AWS Production Deployment

Your friend can deploy to AWS using the provided Terraform infrastructure:

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file=prod.tfvars

# Apply infrastructure
terraform apply -var-file=prod.tfvars

# Deploy with ArgoCD
argocd app create fleetpulse \
  --repo https://github.com/yourusername/Fleet-management-system \
  --path infra/helm-charts \
  --dest-server https://kubernetes.default.svc
```

**AWS Resources Created:**
- DynamoDB tables (Vehicles, Trips, Alerts, Drivers, AgentConfig)
- Kinesis Data Stream (fleetpulse-gps-stream)
- Lambda functions (Kinesis consumer, anomaly detector, alert sender)
- SNS topics for notifications
- EKS cluster with auto-scaling
- RDS for persistent storage
- CloudWatch for monitoring

---

## Environment Configuration

### .env File

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# LocalStack (Development)
USE_LOCALSTACK=true
LOCALSTACK_ENDPOINT=http://localhost:4566

# API Keys
ANTHROPIC_API_KEY=your_claude_api_key
GROQ_API_KEY=your_groq_api_key

# Twilio (Alerts)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_service_sid

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET_KEY=your_secret_key_change_in_production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

---

## API Documentation

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/vehicles` | List all vehicles |
| GET | `/api/vehicles/{id}` | Get vehicle details |
| GET | `/api/trips` | List trips |
| GET | `/api/alerts` | List alerts |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/signup` | User registration |

### WebSocket Events

```javascript
// Connect to live updates
const socket = io('http://localhost:8000');

// Listen for vehicle updates
socket.on('vehicle_update', (data) => {
  console.log('Vehicle location:', data);
});

// Listen for alerts
socket.on('alert', (data) => {
  console.log('New alert:', data);
});
```

---

## Monitoring & Observability

### Grafana Dashboards

Access Grafana at `http://localhost:3001` (admin/fleetpulse123)

**Pre-configured Dashboards:**
- Fleet Overview (vehicle count, active trips, alerts)
- Vehicle Performance (speed, fuel consumption, maintenance)
- Alert Analytics (anomaly trends, alert distribution)
- System Health (API latency, error rates, resource usage)

### Prometheus Metrics

```
# Vehicle metrics
fleetpulse_vehicles_active
fleetpulse_trips_total
fleetpulse_alerts_total

# API metrics
http_requests_total
http_request_duration_seconds
http_requests_in_progress

# System metrics
process_cpu_seconds_total
process_resident_memory_bytes
```

### Loki Logs

All container logs are aggregated in Loki. Query examples:

```
{container="fleetpulse-backend"} | json | level="ERROR"
{container="fleetpulse-celery-worker"} | json | status="failed"
```

---

## Agentic AI Features

The platform includes autonomous agents powered by LangChain and Claude:

### Available Tools

- **Vehicle Analysis**: Analyze vehicle performance and health
- **Trip Optimization**: Suggest optimal routes and schedules
- **Alert Management**: Autonomous alert handling and escalation
- **Predictive Maintenance**: Predict maintenance needs
- **Driver Insights**: Analyze driver behavior and safety

### Example Agent Interaction

```python
from agent.fleet_agent import FleetAgent

agent = FleetAgent()
response = agent.run("Analyze vehicle VH001 performance and suggest optimizations")
print(response)
```

---

## Testing

```bash
# Run backend tests
docker-compose exec backend pytest tests/ -v

# Run frontend tests
docker-compose exec frontend npm test

# Run integration tests
docker-compose exec backend pytest tests/integration/ -v

# Generate coverage report
docker-compose exec backend pytest --cov=app tests/
```

---

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs backend

# Verify LocalStack is healthy
curl http://localhost:4566/_localstack/health

# Restart services
docker-compose restart
```

### Database connection issues

```bash
# Verify DynamoDB tables exist
aws dynamodb list-tables --endpoint-url http://localhost:4566 --region ap-south-1

# Recreate tables
docker-compose exec localstack bash /etc/localstack/init/ready.d/init-localstack.sh
```

### Frontend can't connect to backend

```bash
# Check backend is running
curl http://localhost:8000/health

# Verify CORS settings in backend/app/main.py
# Check frontend environment: VITE_API_URL=http://localhost:8000
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support & Documentation

- **Architecture Guide**: [docs/architecture.md](docs/architecture.md)
- **API Reference**: [docs/api-contracts.md](docs/api-contracts.md)
- **Data Models**: [docs/data-models.md](docs/data-models.md)
- **LocalStack Setup**: [docs/local-setup.md](docs/local-setup.md)
- **AWS Deployment**: [infra/terraform/README.md](infra/terraform/README.md)

---

## Deployment Links

| Environment | URL | Status |
|-------------|-----|--------|
| **LocalStack (Dev)** | http://localhost:3000 | ✅ Local |
| **AWS Production** | `https://fleetpulse.yourdomain.com` | 🔄 Pending |
| **API Docs** | http://localhost:8000/docs | ✅ Local |
| **Monitoring** | http://localhost:3001 | ✅ Local |

---

**Last Updated**: April 2026 | **Version**: 1.0.0
