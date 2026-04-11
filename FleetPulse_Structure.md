# FleetPulse — Reconciled Project Structure
> P1 = Farhana | P2 = Nandhana
> Legend: ✅ Done & committed | 📁 Folder exists, empty | 🔨 You build this | 📝 Shared contract file

---

```
Fleet-management-system/               ← GitHub repo (Nandhana28/Fleet-management-system)
│
├── .github/                           ✅ Folder exists (Farhana)
│   └── workflows/
│       ├── .gitkeep                   ✅ Placeholder
│       ├── ci.yml                     🔨 Farhana writes this (Week 3)
│       ├── cd.yml                     🔨 Farhana writes this (Week 3)
│       └── pr-checks.yml              🔨 Farhana writes this (Week 3)
│
├── .gitignore                         ✅ Done (Farhana) — already ignores .terraform, *.tfstate
│   ⚠ YOU MUST ADD: .env, __pycache__, node_modules, *.pyc, venv/
│
├── .pre-commit-config.yaml            ✅ Done (Farhana) — black, flake8 hooks
│
├── README.md                          ✅ Done (Farhana) — update with your services later
│
│
├── docs/                              📝 DOES NOT EXIST YET — YOU CREATE THIS FOLDER
│   ├── data-models.md                 📝 SHARED CONTRACT — create before writing any DB code
│   ├── api-contracts.md               📝 SHARED CONTRACT — create before writing any endpoints
│   ├── redis-keys.md                  📝 SHARED CONTRACT — create before writing cache_service
│   ├── event-schemas.md               📝 SHARED CONTRACT — IoT payload shape from Farhana's simulator
│   ├── architecture.md                📝 Shared — text diagram of full system
│   └── local-setup.md                 📝 Shared — how to clone and run for both devs
│
│
├── shared/                            📝 DOES NOT EXIST YET — YOU CREATE THIS FOLDER
│   ├── constants.py                   📝 SHARED — DynamoDB table names, Redis key templates, topic names
│   ├── schemas.py                     📝 SHARED — Pydantic models: Vehicle, Trip, Alert, Driver
│   └── exceptions.py                  📝 SHARED — Common exception classes
│
│
├── simulator/                         ← Farhana's domain
│   ├── gps_simulator.py               ✅ Done (Farhana) — 10 vehicles, MQTT, chaos mode
│   └── .gitkeep                       ✅ Placeholder
│   ⚠ vehicle_profiles.py, chaos.py, route_data/ — NOT YET written (Farhana Week 2)
│
│
├── infra/                             ← Farhana's domain
│   ├── terraform/
│   │   ├── provider.tf                ✅ Done — AWS Mumbai ap-south-1
│   │   ├── main.tf                    ✅ Done — S3 state bucket + DynamoDB lock table
│   │   ├── dynamodb.tf                ✅ Done — 5 tables: Vehicles, Trips, Alerts, Drivers, AgentConfig
│   │   ├── iot_core.tf                ✅ Done — 10 vehicle Things + policy
│   │   ├── kinesis.tf                 ✅ Done (pending activation on AWS)
│   │   ├── lambda.tf                  ✅ Done — 3 Lambda stubs (real code Week 2)
│   │   ├── iam.tf                     ✅ Done — Lambda + ECS roles
│   │   ├── ecr_vpc.tf                 ✅ Done — ECR repos + VPC + subnets + security group
│   │   ├── .terraform.lock.hcl        ✅ Done
│   │   ├── terraform.tfstate          ✅ Done (⚠ should move to S3 remote — Farhana's task)
│   │   └── terraform.tfstate.backup   ✅ Done
│   │   ⚠ variables.tf, outputs.tf, backend.tf, terraform.tfvars — NOT YET (Farhana)
│   │   ⚠ modules/ subfolders — NOT YET (Farhana Week 2)
│   │
│   ├── helm-charts/
│   │   └── .gitkeep                    📁 Empty — Farhana fills Week 3
│   │
│   └── terragrunt/
│       ├── .gitkeep                   ✅ Placeholder
│       └── terragrunt.hcl             ✅ Done — points to S3 state + DynamoDB lock
│
│
├── pipeline/                          ← Farhana's domain
│   ├── kinesis_consumer/
│   │   └── .gitkeep                   📁 Empty — Farhana fills Week 2
│   └── lambda_functions/
│       └── .gitkeep                   📁 Empty — Farhana fills Week 2
│
│
├── ml/                                ← Farhana's domain
│   └── anomaly_detection/
│       └── .gitkeep                   📁 Empty — Farhana fills Week 2
│
│
├── monitoring/                        ← Farhana's domain
│   ├── prometheus/
│   │   └── .gitkeep                   📁 Empty — Farhana fills Week 3
│   └── grafana/
│       └── .gitkeep                   📁 Empty — Farhana fills Week 3
│
│
├── agent/                             ← SHARED (Farhana builds logic, you consume via API)
│   └── .gitkeep                       📁 Empty — Farhana writes Week 3, you wire Week 3
│   ⚠ tools.py, fleet_agent.py, memory.py — Farhana Week 3
│   ⚠ tool_schemas.py, prompts.py      — SHARED, both agree before Farhana writes
│
│
├── backend/                           🔨 YOUR DOMAIN — Nandhana
│   │
│   ├── app/
│   │   ├── main.py                    🔨 Week 1 Day 3 — FastAPI init, routers, Socket.io mount
│   │   ├── config.py                  🔨 Week 1 Day 3 — Pydantic Settings, reads all .env vars
│   │   ├── dependencies.py            🔨 Week 1 Day 3 — get_db(), get_redis(), get_current_user()
│   │   │
│   │   ├── routers/
│   │   │   ├── vehicles.py            🔨 Week 1 Day 3
│   │   │   ├── alerts.py              🔨 Week 1 Day 4
│   │   │   ├── analytics.py           🔨 Week 1 Day 4
│   │   │   ├── agent.py               🔨 Week 3 Day 5 (stub it Week 1)
│   │   │   ├── settings.py            🔨 Week 4 Day 1
│   │   │   └── health.py              🔨 Week 1 Day 3 (first thing you write)
│   │   │
│   │   ├── services/
│   │   │   ├── vehicle_service.py     🔨 Week 2 Day 1
│   │   │   ├── alert_service.py       🔨 Week 2 Day 1
│   │   │   ├── analytics_service.py   🔨 Week 2 Day 3
│   │   │   ├── cache_service.py       🔨 Week 2 Day 1-2
│   │   │   └── secrets_service.py     🔨 Week 4 Day 2
│   │   │
│   │   ├── db/
│   │   │   ├── dynamodb.py            🔨 Week 1 Day 3 — boto3 init with LocalStack toggle
│   │   │   └── queries.py             🔨 Week 1 Day 4 — all raw DynamoDB operations
│   │   │
│   │   ├── websocket/
│   │   │   ├── socket_server.py       🔨 Week 3 Day 1
│   │   │   └── events.py              🔨 Week 3 Day 1
│   │   │
│   │   └── middleware/
│   │       ├── auth.py                🔨 Week 1 Day 5
│   │       ├── cors.py                🔨 Week 1 Day 3 (add immediately)
│   │       └── logging.py             🔨 Week 3 Day 5
│   │
│   ├── tasks/
│   │   ├── celery_app.py              🔨 Week 2 Day 3
│   │   ├── reports.py                 🔨 Week 2 Day 4
│   │   └── alerts.py                  🔨 Week 2 Day 4
│   │
│   ├── tests/
│   │   ├── conftest.py                🔨 Week 1 Day 5
│   │   ├── test_vehicles.py           🔨 Week 2
│   │   ├── test_alerts.py             🔨 Week 2
│   │   ├── test_analytics.py          🔨 Week 3
│   │   ├── test_agent_router.py       🔨 Week 3
│   │   └── test_cache_service.py      🔨 Week 2
│   │
│   ├── Dockerfile                     🔨 Week 1 Day 5
│   ├── requirements.txt               🔨 Week 1 Day 3 (create first)
│   └── .env.example                   🔨 Week 1 Day 1 (template only, never commit .env)
│
│
├── frontend/                          🔨 YOUR DOMAIN — Nandhana
│   │
│   ├── public/
│   │   ├── index.html                 🔨 Auto-created by Vite
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── main.tsx                   🔨 Week 2 Day 5
│   │   ├── App.tsx                    🔨 Week 2 Day 5 — routes: /, /analytics, /agent, /settings
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          🔨 Week 2 Day 5
│   │   │   ├── Analytics.tsx          🔨 Week 3 Day 3
│   │   │   ├── Agent.tsx              🔨 Week 3 Day 5
│   │   │   └── Settings.tsx           🔨 Week 4 Day 1
│   │   │
│   │   ├── components/
│   │   │   ├── map/                   🔨 Week 3 Day 1-2
│   │   │   ├── charts/                🔨 Week 3 Day 3-4
│   │   │   ├── agent/                 🔨 Week 3 Day 5
│   │   │   ├── alerts/                🔨 Week 2 Day 5
│   │   │   ├── layout/                🔨 Week 2 Day 5
│   │   │   └── ui/                    🔨 Week 2 Day 5 (build reusables first)
│   │   │
│   │   ├── hooks/                     🔨 Week 2-3
│   │   ├── services/                  🔨 Week 2 Day 5
│   │   ├── types/                     🔨 Week 2 Day 5 (TypeScript interfaces)
│   │   ├── store/                     🔨 Week 3 Day 1 (Zustand, after Socket.io)
│   │   └── utils/                     🔨 Week 2 Day 5
│   │
│   ├── Dockerfile                     🔨 Week 3 Day 5
│   ├── nginx.conf                     🔨 Week 3 Day 5
│   ├── package.json                   🔨 Auto-created by Vite
│   ├── tsconfig.json                  🔨 Auto-created by Vite
│   ├── tailwind.config.js             🔨 Week 2 Day 5
│   ├── vite.config.ts                 🔨 Week 2 Day 5
│   └── .env.example                   🔨 Week 2 Day 5
│
│
├── k6/                                ← Farhana's domain — Week 4
│
│
├── postman/
│   └── FleetPulse.postman_collection.json  🔨 YOUR job — Week 4 Day 3
│
│
├── scripts/
│   ├── seed_demo_data.py              🔨 YOUR job — Week 4 Day 3
│   ├── generate_jwt.py                🔨 YOUR job — Week 1 Day 5
│   ├── check_localstack.sh            🔨 Farhana's job
│   └── cleanup_aws.sh                 🔨 Farhana's job
│
│
├── docker-compose.yml                 🔨 YOUR job — Week 1 Day 1 (FIRST FILE YOU WRITE)
├── docker-compose.test.yml            🔨 YOUR job — Week 2
├── .env.example                       🔨 YOUR job — Week 1 Day 1 (alongside docker-compose)
├── Makefile                           🔨 SHARED — you write it, Farhana adds her targets
└── README.md                          ✅ Exists — you update with your services as you build
```

---

## What Farhana Has vs What the Plan Expected

| Planned File | Status |
|---|---|
| `infra/terraform/provider.tf` | ✅ Done |
| `infra/terraform/main.tf` | ✅ Done (S3 + DynamoDB state) |
| `infra/terraform/dynamodb.tf` | ✅ Done (all 5 tables) |
| `infra/terraform/iot_core.tf` | ✅ Done |
| `infra/terraform/kinesis.tf` | ✅ Done (AWS activation pending) |
| `infra/terraform/lambda.tf` | ✅ Done (stubs only) |
| `infra/terraform/iam.tf` | ✅ Done |
| `infra/terraform/ecr_vpc.tf` | ✅ Done |
| `simulator/gps_simulator.py` | ✅ Done |
| `infra/terraform/variables.tf` | ❌ Not yet |
| `infra/terraform/outputs.tf` | ❌ Not yet (you need this for table names) |
| `infra/helm-charts/` | ❌ Not yet |
| `docs/` entire folder | ❌ Not yet — YOU create this |
| `shared/` entire folder | ❌ Not yet — YOU create this |
| `agent/` files | ❌ Not yet |
| `backend/` files | ❌ Not yet — YOUR job |
| `frontend/` files | ❌ Not yet — YOUR job |

---

## Your Week 1 File Creation Order

```
Day 1
  1. docker-compose.yml              ← foundation, everything runs through this
  2. .env.example                    ← document every env var as you add services
  3. docs/data-models.md             ← agree with Farhana on DynamoDB table schemas
  4. docs/redis-keys.md              ← agree Redis key format before writing cache_service

Day 2
  5. shared/constants.py             ← table names, key templates (import in both backend + Lambda)
  6. shared/schemas.py               ← Vehicle, Trip, Alert, Driver Pydantic models
  7. shared/exceptions.py            ← common exceptions
  8. Update .gitignore               ← add .env, __pycache__, node_modules, venv/

Day 3
  9. backend/requirements.txt
  10. backend/app/config.py          ← Pydantic Settings reads .env
  11. backend/app/db/dynamodb.py     ← boto3 init with LocalStack toggle
  12. backend/app/routers/health.py  ← GET /health (simplest possible, verify FastAPI works)
  13. backend/app/main.py            ← wire everything together

Day 4
  14. backend/app/db/queries.py      ← all DynamoDB operations
  15. backend/app/routers/vehicles.py
  16. backend/app/routers/alerts.py

Day 5
  17. backend/app/middleware/auth.py
  18. backend/tests/conftest.py
  19. scripts/generate_jwt.py
  20. backend/Dockerfile
```

---

## The 4 Contract Files to Agree With Farhana Before Writing Any Code

These are the files where a mismatch between your code and hers will cause bugs. Create them first, share with her, get her confirmation.

1. `docs/data-models.md` — exact DynamoDB table names and attribute names she used in her `.tf` files
2. `docs/redis-keys.md` — key format you'll use (e.g. `vehicle:{vehicle_id}:location`)
3. `shared/constants.py` — Python source of truth both your backend and her Lambda will import
4. `docs/event-schemas.md` — the exact GPS payload shape from `gps_simulator.py` (she has this)
