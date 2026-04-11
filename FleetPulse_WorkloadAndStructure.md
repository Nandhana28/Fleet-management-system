# FleetPulse — Workload Split, Weekly Plan & Folder Structure
> P1 = Farhana | P2 = Nandhana
> Revised: agent/prompts.py + agent/tool_schemas.py moved to Nandhana's ownership

---

## Workload Ratio (Revised)

| | Farhana (P1) | Nandhana (P2) |
|---|---|---|
| **Ratio** | **55%** | **45%** |
| **Nature of work** | Deep infra, hard to debug, invisible to evaluator | Visible to evaluator, broad surface area, integration glue |
| **Risk** | Terraform/K8s failures are cryptic | Demo breaks are public |

The agent prompts shift matters more than it looks. `prompts.py` isn't just a text file — it determines how intelligent the AI assistant *appears* to the faculty. Getting the system prompt, few-shot examples, and tool descriptions right takes real iteration. That work now sits with you.

---

## What Each Person Owns — Full List

### Farhana (P1) — Cloud, DevOps, Pipeline, ML, Agent Logic

| Area | Files / Folders |
|---|---|
| GitHub setup & CI/CD | `.github/workflows/` |
| Terraform infra | `infra/terraform/` (all 10 modules) |
| Helm charts | `infra/helm-charts/` |
| ArgoCD | `infra/argocd/` |
| GPS Simulator | `simulator/` |
| Kinesis consumer | `pipeline/kinesis_consumer/` |
| Lambda functions | `pipeline/lambda_functions/` (all 3) |
| ML anomaly detection | `ml/` |
| Monitoring stack | `monitoring/` (Prometheus, Grafana, Loki) |
| Load testing | `k6/` |
| Agent — tool logic | `agent/tools.py` |
| Agent — state machine | `agent/fleet_agent.py` |
| Agent — memory | `agent/memory.py` |
| Agent — streaming | `agent/streaming.py` |
| Infra scripts | `scripts/check_localstack.sh`, `scripts/cleanup_aws.sh` |

### Nandhana (P2) — Backend, Frontend, Agent Brain

| Area | Files / Folders |
|---|---|
| FastAPI backend | `backend/app/` (all routers, services, db, websocket, middleware) |
| Celery tasks | `backend/tasks/` |
| Backend tests | `backend/tests/` |
| React frontend | `frontend/src/` (all pages, components, hooks, services, types) |
| Frontend Dockerfiles | `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf` |
| Local dev environment | `docker-compose.yml`, `docker-compose.test.yml` |
| API documentation | `postman/` |
| Demo seed data | `scripts/seed_demo_data.py` |
| JWT test util | `scripts/generate_jwt.py` |
| **Agent — prompts** | **`agent/prompts.py`** ← moved to you |
| **Agent — tool schemas** | **`agent/tool_schemas.py`** ← moved to you |
| **Agent — frontend** | **`frontend/src/pages/Agent.tsx` + all `components/agent/`** |

### Shared (Both — never change alone)

| File | Purpose |
|---|---|
| `docs/data-models.md` | DynamoDB table schemas + attribute names |
| `docs/api-contracts.md` | All API request/response shapes |
| `docs/redis-keys.md` | Every Redis key pattern |
| `docs/event-schemas.md` | MQTT payload, Kinesis record, SNS message shape |
| `shared/constants.py` | Redis key templates + DynamoDB table names (imported by both) |
| `shared/schemas.py` | Pydantic models shared between backend + Lambda |
| `shared/exceptions.py` | Common exception classes |
| `Makefile` | Shortcut commands for both |
| `README.md` | Project overview |

---

## Why `prompts.py` and `tool_schemas.py` belong with you

`agent/tools.py` (Farhana) defines *what* each tool does in Python.
`agent/tool_schemas.py` (you) defines *how each tool is described to Claude* — the name, description, input schema, output format.
`agent/prompts.py` (you) is the system prompt that makes the agent sound like a real fleet assistant, not a generic chatbot.

These two files control:
- Whether Claude picks the right tool for a query
- Whether the agent response sounds professional in Tamil Nadu fleet context
- What tool cards your `ToolCard.tsx` renders in the chat UI

Farhana builds the engine. You write the personality and the interface contract.

---

## 4-Week Plan — Nandhana (P2)

### WEEK 1 — FastAPI + Docker Compose + LocalStack

**Day 1 (with Farhana — do this together on Day 1 of the project)**
- Clone repo Farhana creates
- Together: fill in `docs/data-models.md`, `docs/redis-keys.md`, `docs/api-contracts.md`, `docs/event-schemas.md`
- Together: write `shared/constants.py` and `shared/schemas.py`
- These 5 files are locked. Neither of you touches them alone after this.

**Day 1-2: Local Dev Environment**
- Install Docker Desktop, Docker Compose, LocalStack CLI
- Write `docker-compose.yml` — services: fastapi, redis, celery-worker, localstack, prometheus, grafana
- Configure LocalStack to emulate: DynamoDB, S3, SNS, SQS, Lambda, SecretsManager
- Run `docker-compose up` — verify all services start cleanly
- Write `docker-compose.test.yml` — stripped version for CI (no Grafana/Loki)
- Test LocalStack DynamoDB manually: create table → insert → query → confirm
- Write `.env.example` at root level — all env vars documented

*Deliverable to Farhana: working docker-compose with LocalStack so she can test her Lambda locally too*

**Day 3-5: FastAPI Backend — All Endpoints**
- Create full project structure under `backend/app/`
- Import `shared/schemas.py` — do NOT redefine Vehicle, Trip, Alert locally
- Write `app/config.py` — Pydantic Settings, reads AWS_ENDPOINT_URL (LocalStack in dev, real AWS in prod)
- Write `app/db/dynamodb.py` and `app/db/queries.py` — all DynamoDB operations in one place
- Write all routers: vehicles, alerts, analytics, agent (stub), settings, health
- Write all services: vehicle_service, alert_service, analytics_service, cache_service, secrets_service
- `cache_service.py` must use key formats EXACTLY from `shared/constants.py` — this is where Farhana's Lambda and your API meet
- Add JWT middleware, CORS, structured logging
- Add Prometheus metrics endpoint (`GET /metrics`) using prometheus-fastapi-instrumentator
- Write `backend/Dockerfile` — multi-stage, python:3.11-slim
- Push to DockerHub: `yourusername/fleetpulse-backend:latest`
- Test all endpoints in Postman, start `postman/FleetPulse.postman_collection.json`

*Integration checkpoint with Farhana end of Week 1: she connects her LocalStack Terraform tables to your FastAPI*

---

### WEEK 2 — Redis + Celery + React Map Foundation

**Day 1-2: Redis Cache**
- Write `backend/app/services/cache_service.py`
  - `update_vehicle_location(id, lat, lng)` — write to Redis, TTL 60s
  - `GET /vehicles` reads Redis first, falls back to DynamoDB if miss
- Redis key format: whatever is in `shared/constants.py` — not hardcoded strings in this file
- Write Pytest tests: cache hit → correct location, cache miss → DynamoDB fallback
- This is the most critical integration point with Farhana's Lambda. Test it with a manually seeded Redis key first.

**Day 3-4: Celery Background Tasks**
- Add celery-worker and celery-beat to `docker-compose.yml`
- Write `backend/tasks/celery_app.py` — broker=Redis, beat schedule
- Write `backend/tasks/reports.py` — `generate_daily_report()`: aggregate DynamoDB → PDF (WeasyPrint) → S3 → SES email, scheduled 11PM via Beat
- Write `backend/tasks/alerts.py` — `batch_unresolved_alerts()`: re-notify every 5 mins
- Test manually: `celery -A app.celery call tasks.reports.generate_daily_report`

**Day 5: React — Foundation + Live Map**
- `npx create-react-app frontend --template typescript` (or Vite — faster)
- Install: react-leaflet, leaflet, chart.js, react-chartjs-2, socket.io-client, tailwindcss, axios, @tanstack/react-query, zustand
- Write `frontend/src/services/api.ts` — Axios instance, auth header injection, error interceptor
- Build main layout: `Sidebar.tsx` + map area + `Header.tsx`
- Write `FleetMap.tsx` — Leaflet centered Coimbatore (11.0168, 76.9558), OpenStreetMap tiles
- Write `useVehicles.ts` hook — React Query polling `GET /vehicles` every 5s
- Render `VehicleMarker.tsx` for each vehicle — green=normal, red=anomaly, grey=offline
- Write `frontend/Dockerfile` — multi-stage Node build + Nginx serve
- Write `frontend/nginx.conf` — serve SPA + proxy `/api` → backend

*Integration checkpoint with Farhana end of Week 2: her Lambda writes to Redis, your map reads from it — vehicles should appear on map*

---

### WEEK 3 — Real-Time Map + Analytics + Agent UI + Prompts

**Day 1-2: Socket.io Real-Time Map**
- Write `backend/app/websocket/socket_server.py` — python-socketio, emit `vehicle_update` on DynamoDB write
- Write `backend/app/websocket/events.py` — event name constants (import these in frontend too, don't hardcode strings)
- Write `useSocket.ts` — connect to Socket.io, `socket.on('vehicle_update', updateMarker)`, cleanup on unmount
- Write `vehicleStore.ts` (Zustand) — store live positions updated by Socket.io
- Map vehicles now move in real time without polling
- Add `GeofenceOverlay.tsx` — circle on map, vehicles outside zone get red marker + blink animation
- Add `RoutePolyline.tsx` — last 30-min GPS path as blue line for selected vehicle
- Add `VehiclePopup.tsx` — click marker: vehicle ID, driver name, speed, fuel %, trip status

**Day 3-4: Analytics Dashboard**
- Build `/analytics` page with 4 sections
- `FuelChart.tsx` — line chart, fuel per vehicle last 7 days, one line per vehicle (Chart.js)
- `KmBarChart.tsx` — bar chart, km driven per vehicle this month, sorted descending
- `AnomalyDoughnut.tsx` — doughnut, fuel theft vs overspeeding vs deviation %
- `DriverLeaderboard.tsx` — table ranked by composite score
- Add date range picker — all charts update dynamically
- Export to PDF button
- Write `useAnalytics.ts` hook with date range param

**Day 5: Agent Prompts + Agent Chat UI**

This is the most intellectually demanding day. Do prompts first, UI second.

*Prompts (agent/prompts.py):*
- Write the system prompt — Claude should know: it is a fleet assistant for Tamil Nadu logistics businesses, it has access to specific tools, it should be concise and action-oriented, it should use Tamil Nadu vehicle reg format (TN-XX-XX-XXXX), it should address the fleet owner respectfully
- Write few-shot examples — at least 3: location query, alert summary, broadcast message. These teach Claude the expected response style
- Write tool descriptions for every tool in `agent/tool_schemas.py` — description must be specific enough that Claude picks the right tool every time. Vague descriptions = wrong tool calls = broken agent

*Chat UI (frontend/src/pages/Agent.tsx + components/agent/):*
- Build `/agent` page — chat layout, message bubbles
- `ChatWindow.tsx`, `ChatInput.tsx`, `MessageBubble.tsx`
- `useAgentStream.ts` — POST `/agent` → ReadableStream → word-by-word state update (streaming)
- `ToolCard.tsx` — reads tool name from stream, shows "Querying vehicle database..." card. Card content comes from `agent/tool_schemas.py` — import the display labels from there
- `MiniMap.tsx` — 200x200 Leaflet map embedded in bubble when agent returns GPS coords
- `QuickActions.tsx` — preset buttons below input
- `useVoiceInput.ts` — Web Speech API, transcript → input field

*Integration checkpoint with Farhana end of Week 3: her agent tools + your prompts + your UI = full end-to-end agent demo*

---

### WEEK 4 — Settings UI + Secrets + Polish + Integration Tests

**Day 1-2: Alert Settings UI + AWS Secrets Manager**
- Build `/settings` page
- Form: WhatsApp number, email — saved to DynamoDB via `POST /settings`
- Toggle switches: fuel theft, overspeeding, geofence breach alerts
- Number inputs: max speed (km/h), geofence radius (km), min fuel warning (%)
- "Send Test Alert" button — fires real WhatsApp via Twilio
- Write `backend/app/services/secrets_service.py` — fetch Twilio credentials from AWS Secrets Manager at runtime, never hardcoded

**Day 3: Seed Data + Demo Prep**
- Write `scripts/seed_demo_data.py` — populate DynamoDB with:
  - 8-10 Tamil Nadu vehicles (TN-33 Coimbatore plates)
  - Tamil driver names (Murugan, Selvam, Rajan, Priya, Karthik...)
  - Realistic trip history over last 7 days
  - 3-4 seeded anomaly alerts (one fuel theft, one overspeed, one route deviation)
  - Settings record with a real WhatsApp number for live demo
- Run `make seed` — verify dashboard populates realistically
- Write `scripts/generate_jwt.py` — mint a test token for Postman + demo login

**Day 4-5: Integration Tests + Final Polish**
- Write Postman collection — all 20+ endpoints, example requests, auth tokens, response schemas
- Write Pytest integration tests: full flow from vehicle update → dashboard render
- Make frontend fully mobile-responsive (TailwindCSS breakpoints)
- Add `ErrorBoundary.tsx` — any component crash shows friendly error instead of blank screen
- Final cross-test with Farhana: GPS Simulator → Kinesis → Lambda → DynamoDB → Redis → FastAPI → React map → AI agent → Twilio WhatsApp
- Coordinate Dockerfile push + Helm deploy with Farhana (she deploys your images to EKS)

---

## 4-Week Plan — Farhana (P1)

### WEEK 1 — Terraform + GitHub + GPS Simulator

**Day 1 (with Nandhana — do this together)**
- Create GitHub repo, branch structure, branch protection rules on main and develop
- Set up pre-commit: Black, Flake8, trailing-whitespace
- Set up GitHub Projects Kanban board
- Together: fill `docs/` contracts and `shared/` files (see Nandhana Week 1 Day 1)
- Write initial `README.md`

**Day 2-4: Terraform — All AWS Infrastructure**
- Write `infra/terraform/backend.tf` — S3 remote state, DynamoDB state lock (both devs share this state)
- Write all 10 Terraform modules: iot, kinesis, dynamodb, lambda, sns, ses, s3, ecr, eks, iam
- DynamoDB module must create tables with EXACT names from `shared/constants.py` (ask Nandhana before apply)
- Write Terragrunt config for dev/prod separation
- `terraform plan` → review → `terraform apply`
- Screenshot all created resources in AWS Console

**Day 4-5: GPS Simulator**
- Write `simulator/gps_simulator.py` — 10 vehicles, Coimbatore GPS coords, MQTT to IoT Core
- Each payload: vehicle_id, lat, lng, speed, fuel_level, driver_id, timestamp — match `shared/schemas.py` EXACTLY
- Add `simulator/chaos.py` — random anomaly injection for ML testing
- Populate `simulator/route_data/coimbatore_routes.json` with real road coords
- Test with LocalStack first, then real IoT Core

---

### WEEK 2 — Kinesis Pipeline + Lambda + ML

**Day 1-3: Kinesis → Lambda Pipeline**
- Write IoT Core Rule — forward MQTT → Kinesis stream
- Write `pipeline/lambda_functions/gps_processor/handler.py`:
  - Reads Kinesis batch → decodes → calls ML predictor → writes DynamoDB → writes Redis
  - Redis write: use key format from `shared/constants.py` — this is where your Lambda and Nandhana's API connect
  - DynamoDB write: attribute names MUST match `docs/data-models.md`
- Write `pipeline/lambda_functions/alert_dispatcher/handler.py` — triggered by DynamoDB Streams on alerts table → SNS → Twilio
- Write `pipeline/lambda_functions/report_generator/handler.py` — EventBridge scheduled → PDF → S3 → SES
- Test full pipeline: Simulator → IoT → Kinesis → Lambda → DynamoDB

**Day 3-5: ML Anomaly Detection**
- Write `ml/anomaly_detection/model.py` — Isolation Forest, train + predict
- Write `ml/anomaly_detection/features.py` — speed delta, fuel rate, heading change
- Generate 10,000 synthetic training records in `ml/data/`
- Train → save `model.pkl` to S3
- Integrate `predictor.py` into Lambda gps_processor handler
- Detect: fuel theft (>15% sudden drop), overspeeding (>80 km/h), route deviation (>2km)
- On anomaly: write Alert to DynamoDB → publish to SNS
- Write Pytest tests covering all 3 anomaly types

*Integration checkpoint with Nandhana end of Week 2: Lambda writes Redis, her map reads it*

---

### WEEK 3 — Kubernetes + Monitoring + Agent Backend Logic

**Day 1-2: Minikube + Helm**
- Install Minikube, kubectl, Helm
- Write all Helm chart templates under `infra/helm-charts/fleetpulse/templates/`
- `values.yaml` — image tags pointing to DockerHub images Nandhana pushes
- Deploy to Minikube locally: `helm install fleetpulse ./infra/helm-charts/`
- Provision EKS with eksctl, deploy same charts to cloud
- Configure HPA for FastAPI pods (scale 2→5 replicas under load)

**Day 3-4: Prometheus + Grafana + Loki**
- Deploy Prometheus, Grafana, Loki via Helm on Minikube/EKS
- Write `monitoring/prometheus/prometheus.yml` — scrape FastAPI `/metrics` endpoint (Nandhana exposes this)
- Write 4 Grafana dashboards: fleet_overview, pipeline_health, api_performance, infrastructure
- Write `monitoring/prometheus/alert_rules.yml` — fire Slack alert when anomaly rate > 5/min
- Configure Loki for log aggregation from all containers

**Day 5: Agent Backend Logic**
- Write `agent/tools.py` — all LangChain tool functions (query_vehicle_location, get_driver_stats, send_broadcast_alert, generate_fuel_report, get_active_alerts, update_vehicle_status)
- Each tool wraps a Boto3 call to DynamoDB/SNS/Lambda/Redis
- **Coordinate with Nandhana**: she is writing `tool_schemas.py` the same day. Sync on tool names and output shapes before writing.
- Write `agent/fleet_agent.py` — LangGraph state machine: receive query → reason → pick tool → execute → check result → respond
- Write `agent/memory.py` — Redis conversation memory, last 10 turns per user, 1hr TTL
- Write `agent/streaming.py` — FastAPI StreamingResponse wrapper for LangChain stream output

*Integration checkpoint with Nandhana end of Week 3: her prompts + your tools + her chat UI = working agent*

---

### WEEK 4 — CI/CD + Load Testing + Final Validation

**Day 1-3: GitHub Actions + ArgoCD**
- Write `.github/workflows/ci.yml` — trigger on PR to develop: run pytest + eslint + black
- Write `.github/workflows/cd.yml` — trigger on merge to develop: build Docker images → push ECR → update Helm values.yaml image tag → commit back
- Install ArgoCD on EKS, write `infra/argocd/application.yaml` pointing to repo
- ArgoCD auto-syncs every 3 min — detects Helm chart version update → deploys to EKS
- Add Slack notification step: "FleetPulse v1.x deployed to EKS"

**Day 4-5: Load Testing + Final Validation**
- Write `k6/load_test.js` — 500 VUs, 60s, simulate GPS flood + API hits
- Write `k6/scenarios/gps_flood.js` and `k6/scenarios/api_stress.js`
- Run load test: `k6 run --vus 500 --duration 60s k6/load_test.js`
- Watch Grafana dashboards spike during test — screenshot for documentation
- Verify HPA scales FastAPI pods from 2 to 5 under load
- Final cross-test with Nandhana (full end-to-end)
- Run `scripts/cleanup_aws.sh` after demo to avoid surprise charges

---

## Folder Structure (Revised — prompts.py and tool_schemas.py ownership updated)

```
FleetPulse/
│
├── .github/                                ← [P1 Farhana]
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── pr-checks.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                                   ← [SHARED — fill on Day 1 together, never change alone]
│   ├── data-models.md                      # ⚠ DynamoDB table schemas + attribute names
│   ├── api-contracts.md                    # ⚠ All API endpoint shapes
│   ├── redis-keys.md                       # ⚠ Every Redis key format
│   ├── event-schemas.md                    # ⚠ MQTT payload, Kinesis record, SNS message
│   ├── architecture.md
│   ├── local-setup.md
│   ├── demo-script.md
│   └── adr/
│       ├── 001-redis-over-elasticache.md
│       └── 002-dynamodb-over-rds.md
│
├── shared/                                 ← [SHARED — never change alone]
│   ├── constants.py                        # Redis key templates, DynamoDB table names, topic ARNs
│   ├── schemas.py                          # Pydantic: Vehicle, Trip, Alert, Driver, GPSPayload
│   └── exceptions.py
│
├── simulator/                              ← [P1 Farhana]
│   ├── gps_simulator.py
│   ├── vehicle_profiles.py
│   ├── route_data/
│   │   ├── coimbatore_routes.json
│   │   ├── chennai_routes.json
│   │   └── madurai_routes.json
│   ├── chaos.py
│   ├── requirements.txt
│   └── README.md
│
├── infra/                                  ← [P1 Farhana]
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── backend.tf
│   │   ├── terraform.tfvars
│   │   └── modules/
│   │       ├── iot/
│   │       ├── kinesis/
│   │       ├── dynamodb/
│   │       ├── lambda/
│   │       ├── sns/
│   │       ├── ses/
│   │       ├── s3/
│   │       ├── ecr/
│   │       ├── eks/
│   │       └── iam/
│   ├── helm-charts/
│   │   └── fleetpulse/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       ├── values-dev.yaml
│   │       ├── values-prod.yaml
│   │       └── templates/
│   │           ├── backend-deployment.yaml
│   │           ├── backend-service.yaml
│   │           ├── frontend-deployment.yaml
│   │           ├── frontend-service.yaml
│   │           ├── agent-deployment.yaml
│   │           ├── redis-deployment.yaml
│   │           ├── ingress.yaml
│   │           ├── hpa.yaml
│   │           ├── configmap.yaml
│   │           └── secrets.yaml
│   └── argocd/
│       ├── application.yaml
│       └── project.yaml
│
├── pipeline/                               ← [P1 Farhana]
│   ├── kinesis_consumer/
│   │   ├── consumer.py
│   │   └── decoder.py
│   └── lambda_functions/
│       ├── gps_processor/
│       │   ├── handler.py
│       │   ├── dynamodb_writer.py
│       │   ├── redis_writer.py             # Uses shared/constants.py key format
│       │   ├── requirements.txt
│       │   └── Dockerfile
│       ├── alert_dispatcher/
│       │   ├── handler.py
│       │   ├── twilio_sender.py
│       │   ├── sns_publisher.py
│       │   ├── requirements.txt
│       │   └── Dockerfile
│       └── report_generator/
│           ├── handler.py
│           ├── pdf_builder.py
│           ├── s3_uploader.py
│           ├── ses_sender.py
│           ├── requirements.txt
│           └── Dockerfile
│
├── ml/                                     ← [P1 Farhana]
│   └── anomaly_detection/
│       ├── model.py
│       ├── features.py
│       ├── trainer.py
│       ├── predictor.py
│       ├── thresholds.py
│       ├── data/
│       │   ├── synthetic_normal.csv
│       │   └── synthetic_anomaly.csv
│       ├── notebooks/
│       │   └── model_exploration.ipynb
│       ├── tests/
│       │   └── test_model.py
│       └── requirements.txt
│
├── monitoring/                             ← [P1 Farhana]
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── alert_rules.yml
│   ├── grafana/
│   │   ├── datasources/
│   │   │   ├── prometheus.yaml
│   │   │   └── loki.yaml
│   │   └── dashboards/
│   │       ├── fleet_overview.json
│   │       ├── pipeline_health.json
│   │       ├── api_performance.json
│   │       └── infrastructure.json
│   └── loki/
│       └── loki-config.yaml
│
├── agent/
│   ├── tools.py                            ← [P1 Farhana]  LangChain tool implementations
│   ├── fleet_agent.py                      ← [P1 Farhana]  LangGraph state machine
│   ├── memory.py                           ← [P1 Farhana]  Redis conversation memory
│   ├── streaming.py                        ← [P1 Farhana]  StreamingResponse wrapper
│   ├── prompts.py                          ← [P2 Nandhana] System prompt, few-shot examples, persona
│   ├── tool_schemas.py                     ← [P2 Nandhana] Tool names, descriptions, input/output shapes
│   ├── tests/
│   │   ├── test_tools.py                   ← [P1 Farhana]
│   │   └── test_agent.py                   ← [P1 Farhana]
│   └── requirements.txt
│
├── backend/                                ← [P2 Nandhana]
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── routers/
│   │   │   ├── vehicles.py
│   │   │   ├── alerts.py
│   │   │   ├── analytics.py
│   │   │   ├── agent.py
│   │   │   ├── settings.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── vehicle_service.py
│   │   │   ├── alert_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── cache_service.py            # Uses shared/constants.py key format
│   │   │   └── secrets_service.py
│   │   ├── db/
│   │   │   ├── dynamodb.py
│   │   │   └── queries.py
│   │   ├── websocket/
│   │   │   ├── socket_server.py
│   │   │   └── events.py
│   │   └── middleware/
│   │       ├── auth.py
│   │       ├── cors.py
│   │       └── logging.py
│   ├── tasks/
│   │   ├── celery_app.py
│   │   ├── reports.py
│   │   └── alerts.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_vehicles.py
│   │   ├── test_alerts.py
│   │   ├── test_analytics.py
│   │   ├── test_agent_router.py
│   │   └── test_cache_service.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                               ← [P2 Nandhana]
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Agent.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── FleetMap.tsx
│   │   │   │   ├── VehicleMarker.tsx
│   │   │   │   ├── GeofenceOverlay.tsx
│   │   │   │   ├── RoutePolyline.tsx
│   │   │   │   └── VehiclePopup.tsx
│   │   │   ├── charts/
│   │   │   │   ├── FuelChart.tsx
│   │   │   │   ├── KmBarChart.tsx
│   │   │   │   ├── AnomalyDoughnut.tsx
│   │   │   │   └── DriverLeaderboard.tsx
│   │   │   ├── agent/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ToolCard.tsx            # Reads display labels from agent/tool_schemas.py (via API)
│   │   │   │   ├── MiniMap.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── alerts/
│   │   │   │   ├── AlertBanner.tsx
│   │   │   │   └── AlertCard.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── PageWrapper.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Toggle.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Spinner.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useVehicles.ts
│   │   │   ├── useAlerts.ts
│   │   │   ├── useAnalytics.ts
│   │   │   ├── useSocket.ts
│   │   │   ├── useAgentStream.ts
│   │   │   └── useVoiceInput.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── vehicleApi.ts
│   │   │   ├── alertApi.ts
│   │   │   ├── analyticsApi.ts
│   │   │   └── settingsApi.ts
│   │   ├── types/
│   │   │   ├── vehicle.ts
│   │   │   ├── alert.ts
│   │   │   ├── analytics.ts
│   │   │   └── agent.ts
│   │   ├── store/
│   │   │   └── vehicleStore.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       ├── mapHelpers.ts
│   │       └── anomalyColors.ts
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── .env.example
│
├── k6/                                     ← [P1 Farhana]
│   ├── load_test.js
│   └── scenarios/
│       ├── gps_flood.js
│       └── api_stress.js
│
├── postman/                                ← [P2 Nandhana]
│   └── FleetPulse.postman_collection.json
│
├── scripts/
│   ├── seed_demo_data.py                   ← [P2 Nandhana]
│   ├── generate_jwt.py                     ← [P2 Nandhana]
│   ├── check_localstack.sh                 ← [P1 Farhana]
│   └── cleanup_aws.sh                      ← [P1 Farhana]
│
├── docker-compose.yml                      ← [P2 Nandhana]
├── docker-compose.test.yml                 ← [P2 Nandhana]
├── .env.example
├── .gitignore
├── .pre-commit-config.yaml
├── Makefile                                ← [SHARED]
└── README.md                               ← [SHARED]
```

---

## Integration Checkpoints — When You Must Sync With Each Other

| End of | What Farhana delivers to Nandhana | What Nandhana delivers to Farhana |
|---|---|---|
| Week 1 | Terraform provisioned: DynamoDB table names + IoT endpoint + Kinesis ARN | Working docker-compose with LocalStack — Farhana can test Lambda locally |
| Week 2 | Lambda writing Redis with correct key format | FastAPI cache_service reading from that exact Redis key — vehicles appear on map |
| Week 3 | tools.py with all tool function signatures + return types | tool_schemas.py + prompts.py + stub agent router for end-to-end test |
| Week 4 | Docker images deployed to EKS, Helm chart values updated | Final Dockerfiles pushed to DockerHub with correct image tags |
