# FleetPulse
### Real-Time Fleet Intelligence Platform

> 2 Developers | 4 Weeks | 100% Free | Enterprise Scale
> AWS | Docker | Kubernetes | Terraform | Agentic AI | Real-Time Streaming

---

## Team

| Person | Branch | Domain |
|---|---|---|
| Farhana (P1) | `farhana` | Cloud infra, DevOps, data pipeline, ML, GPS simulator |
| Nandhana (P2) | `nandhana` | FastAPI backend, React frontend, Docker Compose, AI agent UI |

---

## Architecture

```
GPS Simulator (Python + Paho MQTT)
        |
AWS IoT Core --> Kinesis Data Stream --> Lambda (Python)
        |
  ML Anomaly Detection (Scikit-learn)
        |
  DynamoDB (trips, alerts, vehicles)
        |
  FastAPI Backend <--> Redis Cache
        |              |
  Celery Workers    Socket.io
        |
  React Dashboard (Leaflet + Chart.js)
        |
  Agentic AI (LangChain + LangGraph + Claude API)
        |
  SNS + Twilio (WhatsApp/SMS) + AWS SES (Email)
        |
  Prometheus + Grafana + Loki
        |
  GitHub Actions --> DockerHub --> ArgoCD --> AWS EKS
```

---

## Folder Structure

```
Fleet-management-system/
|
├── .github/workflows/        [P1] CI/CD pipelines
├── docs/                     [SHARED] Contracts — read before writing code
├── shared/                   [SHARED] Python constants, schemas, exceptions
|
├── simulator/                [P1] GPS simulator — 10 vehicles, Coimbatore
├── infra/terraform/          [P1] AWS infrastructure as code
├── infra/helm-charts/        [P1] Kubernetes deployment charts
├── pipeline/                 [P1] Kinesis consumer + Lambda functions
├── ml/                       [P1] Isolation Forest anomaly detection
├── monitoring/               [P1] Prometheus + Grafana + Loki
|
├── agent/                    [SHARED] LangChain agent — P1 builds, P2 consumes
├── backend/                  [P2] FastAPI REST API + Celery + Socket.io
├── frontend/                 [P2] React dashboard + Leaflet map + charts
|
├── scripts/                  [P2] Seed data, JWT generator, utilities
├── postman/                  [P2] API documentation collection
├── docker-compose.yml        [P2] Local dev — all services in one command
└── Makefile                  [SHARED] Shortcuts for both developers
```

---

## Quick Start (Local Dev)

```bash
# 1. Clone
git clone https://github.com/Nandhana28/Fleet-management-system.git
cd Fleet-management-system

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Start all services
make up

# 4. Verify everything is running
make health

# 5. Run GPS simulator (separate terminal)
make sim
```

---

## Branch Strategy

```
main        — production only, PR required, no direct push
develop     — integration branch, all features merge here first
farhana     — P1 personal workspace
nandhana    — P2 personal workspace
```

Daily workflow:
```bash
# Morning
git checkout your-branch
git pull origin develop
git merge develop

# Evening
git add .
git commit -m "feat(module): description"
git push origin your-branch
# Open PR → develop
```

---

## Contract Files (Both Must Agree Before Changing)

| File | What it controls |
|---|---|
| `docs/data-models.md` | DynamoDB table names + attribute names |
| `docs/redis-keys.md` | Redis key formats |
| `docs/event-schemas.md` | GPS payload shape from simulator |
| `shared/constants.py` | Python source of truth — imported by backend + Lambda |
| `agent/tool_schemas.py` | Interface between agent tools and frontend UI cards |

---

## AWS Infrastructure (Region: ap-south-1 Mumbai)

| Service | Resource Name | Purpose |
|---|---|---|
| DynamoDB | `Vehicles` | Vehicle info |
| DynamoDB | `Trips` | Trip records |
| DynamoDB | `Alerts` | Anomaly alerts |
| DynamoDB | `Drivers` | Driver info |
| DynamoDB | `AgentConfig` | AI agent settings |
| Kinesis | `fleetpulse-gps-stream` | Real-time GPS pipeline |
| Lambda | `fleetpulse-kinesis-consumer` | Reads GPS, writes DynamoDB |
| Lambda | `fleetpulse-anomaly-detector` | Detects anomalies |
| Lambda | `fleetpulse-alert-sender` | Sends WhatsApp/email alerts |

---

## Tech Stack

**P1 — Farhana:**
Terraform, Terragrunt, AWS IoT Core, Kinesis, Lambda, DynamoDB, EKS, Helm, ArgoCD, GitHub Actions, Prometheus, Grafana, Loki, Scikit-learn

**P2 — Nandhana:**
FastAPI, Pydantic, Boto3, Redis, Celery, Socket.io, React TypeScript, Leaflet.js, Chart.js, TailwindCSS, Vite, LangChain, Docker, Docker Compose
