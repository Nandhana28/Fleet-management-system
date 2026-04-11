# FleetPulse — Complete Project Structure with File Descriptions

## Root Level Files

```
Fleet-management-system/
├── .env                              # Environment variables (not committed, created from .env.example)
├── .env.example                      # Template for environment variables
├── .gitignore                        # Git ignore rules (ignores .env, __pycache__, node_modules, etc.)
├── .pre-commit-config.yaml           # Pre-commit hooks (black, flake8 for code quality)
├── README.md                         # Project overview and quick start guide
├── PROJECT_KNOWLEDGE_BASE.md         # Comprehensive project documentation
├── FleetPulse_Structure.md           # Project structure and file organization plan
├── FleetPulse_WorkloadAndStructure.md # Workload distribution between Farhana and Nandhana
├── Makefile                          # Development shortcuts (make up, make test, make seed, etc.)
└── docker-compose.yml                # Local dev environment with all services (FastAPI, Redis, LocalStack, etc.)
```

---

## Backend (`backend/`)

### Root Backend Files
```
backend/
├── .env                              # Backend-specific environment variables
├── .env.example                      # Backend env template
├── requirements.txt                  # Python dependencies (FastAPI, Celery, Boto3, Redis, etc.)
├── Dockerfile                        # Multi-stage Docker build for FastAPI container
├── celerybeat-schedule               # Celery Beat scheduler state file (auto-generated)
```

### Backend App (`backend/app/`)
```
backend/app/
├── __init__.py                       # Python package init
├── main.py                           # FastAPI app initialization, CORS setup, router mounting
├── config.py                         # Pydantic Settings for environment configuration
├── dependencies.py                   # Dependency injection (get_db, get_redis, get_current_user)
```

### Database Layer (`backend/app/db/`)
```
backend/app/db/
├── __init__.py                       # Python package init
├── dynamodb.py                       # DynamoDB resource initialization (LocalStack/AWS toggle)
└── queries.py                        # All DynamoDB operations (vehicles, trips, alerts, drivers)
```

### API Routers (`backend/app/routers/`)
```
backend/app/routers/
├── __init__.py                       # Python package init
├── health.py                         # GET /health endpoint (backend health check)
├── vehicles.py                       # GET /vehicles, GET /vehicles/{id}, GET /vehicles/{id}/trips
├── alerts.py                         # GET /alerts, PATCH /alerts/{id}/resolve
├── analytics.py                      # GET /analytics/fuel, /trips, /drivers (aggregated stats)
├── agent.py                          # POST /agent (stub for LangChain AI agent)
└── auth.py                           # Auth endpoints (register, login, OTP, password reset, Google OAuth)
```

### Business Logic (`backend/app/services/`)
```
backend/app/services/
├── __init__.py                       # Python package init
├── vehicle_service.py                # Vehicle queries with Redis location merge
├── alert_service.py                  # Alert queries and resolution logic
├── analytics_service.py              # Fuel, trip, and driver analytics aggregation
├── cache_service.py                  # Redis operations (vehicle locations, alert counts)
└── auth_service.py                   # User registration, login, JWT, OTP, password reset, Google OAuth
```

### Middleware (`backend/app/middleware/`)
```
backend/app/middleware/
├── __init__.py                       # Python package init
└── auth.py                           # JWT token creation and validation
```

### Celery Tasks (`backend/tasks/`)
```
backend/tasks/
├── __init__.py                       # Python package init
├── celery_app.py                     # Celery app initialization and beat schedule config
├── alerts.py                         # Batch alert notification task (runs every 5 mins)
└── reports.py                        # Daily report generation task (runs at 11 PM)
```

### Tests (`backend/tests/`)
```
backend/tests/
├── .gitkeep                          # Directory marker
├── conftest.py                       # Pytest fixtures (client, auth_headers, mocks)
└── test_vehicles.py                  # Vehicle endpoint tests
```

---

## Frontend (`frontend/`)

### Root Frontend Files
```
frontend/
├── .env                              # Frontend environment variables (API_URL, etc.)
├── .gitignore                        # Frontend-specific git ignore
├── package.json                      # NPM dependencies and scripts (dev, build, lint, preview)
├── package-lock.json                 # Locked dependency versions
├── index.html                        # Entry HTML file
├── README.md                         # Frontend-specific documentation
├── vite.config.ts                    # Vite build configuration
├── tsconfig.json                     # TypeScript configuration
├── tsconfig.app.json                 # App-specific TypeScript config
├── tsconfig.node.json                # Node-specific TypeScript config
├── eslint.config.js                  # ESLint rules for code quality
├── tailwind.config.js                # Tailwind CSS configuration
└── postcss.config.js                 # PostCSS configuration
```

### Frontend Source (`frontend/src/`)
```
frontend/src/
├── main.tsx                          # React app entry point with React Query setup
├── App.tsx                           # Main app component with routing (Dashboard, Analytics, Agent, Settings)
├── App.css                           # App-level styles
├── index.css                         # Global styles
└── vite-env.d.ts                     # Vite environment type definitions
```

### Pages (`frontend/src/pages/`)
```
frontend/src/pages/
├── Home.tsx                          # Landing page with hero, pain points, features, stats
├── Dashboard.tsx                     # Main dashboard with Leaflet map and sidebar
├── Analytics.tsx                     # Analytics page with fuel, km, anomaly charts
├── Agent.tsx                         # AI agent chat interface
├── Settings.tsx                      # User settings page (WhatsApp, email, alert thresholds)
└── auth/
    ├── AuthPages.tsx                 # Email/phone verification, forgot password, reset password
    ├── Login.tsx                     # Login form
    ├── Signup.tsx                    # Registration form
    └── AuthSuccess.tsx               # Post-auth success page
```

### Components (`frontend/src/components/`)
```
frontend/src/components/
├── map/
│   └── FleetMap.tsx                  # Leaflet map with vehicle markers, geofence overlay
├── alerts/
│   ├── AlertBanner.tsx               # Alert notification banner
│   └── AlertCard.tsx                 # Individual alert card component
├── auth/
│   └── AuthLayout.tsx                # Auth page layout wrapper
├── layout/
│   ├── Header.tsx                    # Navigation header
│   └── Sidebar.tsx                   # Dashboard sidebar with menu
├── charts/                           # (Empty - to be filled with Chart.js components)
├── agent/                            # (Empty - to be filled with AI agent UI components)
└── ui/                               # (Empty - to be filled with reusable UI components)
```

### Hooks (`frontend/src/hooks/`)
```
frontend/src/hooks/
├── useVehicles.ts                    # React Query hook for vehicle data (polling every 5s)
├── useAlerts.ts                      # React Query hook for alerts
└── useAnalytics.ts                   # React Query hook for analytics
```

### Services (`frontend/src/services/`)
```
frontend/src/services/
├── api.ts                            # Axios instance with JWT interceptor
├── vehicleApi.ts                     # Vehicle API calls
├── alertApi.ts                       # Alert API calls
├── analyticsApi.ts                   # Analytics API calls
└── authApi.ts                        # Auth API calls
```

### Assets (`frontend/src/assets/`)
```
frontend/src/assets/
├── hero.png                          # Hero section image
├── react.svg                         # React logo
└── vite.svg                          # Vite logo
```

### Public Assets (`frontend/public/`)
```
frontend/public/
├── favicon.svg                       # Browser tab icon
├── icons.svg                         # Icon sprite sheet
└── vite.svg                          # Vite logo
```

### Empty Directories (To Be Filled)
```
frontend/src/
├── store/                            # Zustand state management (vehicle locations, alerts, user settings)
├── types/                            # TypeScript type definitions (Vehicle, Alert, Trip, Driver, etc.)
├── utils/                            # Utility functions (formatters, map helpers, anomaly colors)
├── components/charts/                # Chart components (FuelChart, KmBarChart, AnomalyDoughnut)
├── components/ui/                    # Reusable UI components (Button, Toggle, Badge, Spinner, ErrorBoundary)
└── components/agent/                 # Agent UI components (ChatWindow, ChatInput, ToolCard, MiniMap)
```

---

## Infrastructure (`infra/`)

### Terraform (`infra/terraform/`)
```
infra/terraform/
├── .gitkeep                          # Directory marker
├── .terraform.lock.hcl               # Terraform provider lock file
├── provider.tf                       # AWS provider configuration (ap-south-1 Mumbai region)
├── main.tf                           # S3 state bucket and DynamoDB lock table
├── dynamodb.tf                       # 5 DynamoDB tables (Vehicles, Trips, Alerts, Drivers, AgentConfig)
├── iot_core.tf                       # AWS IoT Core things, thing type, and policy for 10 vehicles
├── kinesis.tf                        # Kinesis stream for GPS data pipeline
├── lambda.tf                         # 3 Lambda functions (kinesis_consumer, anomaly_detector, alert_sender)
├── iam.tf                            # IAM roles and policies for Lambda and ECS
├── ecr_vpc.tf                        # ECR repositories, VPC, subnets, security groups
├── terraform.tfstate                 # Current Terraform state (should move to S3)
├── terraform.tfstate.backup          # Terraform state backup
└── lambda_zips/
    ├── kinesis_consumer.zip          # Kinesis consumer Lambda deployment package
    ├── anomaly_detector.zip          # Anomaly detector Lambda deployment package
    └── alert_sender.zip              # Alert sender Lambda deployment package
```

### Helm Charts (`infra/helm-charts/`)
```
infra/helm-charts/
└── .gitkeep                          # Kubernetes Helm charts (to be filled by Farhana)
```

### Terragrunt (`infra/terragrunt/`)
```
infra/terragrunt/
├── .gitkeep                          # Directory marker
└── terragrunt.hcl                    # Terragrunt configuration for remote state management
```

---

## Simulator (`simulator/`)
```
simulator/
└── gps_simulator.py                  # GPS data generator for 10 vehicles in Coimbatore (MQTT, chaos mode)
```

---

## Monitoring (`monitoring/`)

### Prometheus (`monitoring/prometheus/`)
```
monitoring/prometheus/
├── .gitkeep                          # Directory marker
└── prometheus.yml/                   # Prometheus configuration (directory, not file)
```

### Grafana (`monitoring/grafana/`)
```
monitoring/grafana/
└── .gitkeep                          # Directory marker
```

---

## Scripts (`scripts/`)
```
scripts/
├── generate_jwt.py                   # Generate JWT token for testing
├── seed_demo_data.py                 # Seed DynamoDB with demo vehicles, drivers, alerts
├── create_local_tables.py            # Create DynamoDB tables in LocalStack
└── create_users_table.py             # Create Users table in DynamoDB
```

---

## Shared (`shared/`)
```
shared/
├── constants.py                      # DynamoDB table names, Redis key templates, SNS topic ARNs
├── schemas.py                        # Pydantic models (Vehicle, Trip, Alert, Driver, GPSPayload)
└── exceptions.py                     # Common exception classes
```

---

## Agent (`agent/`)
```
agent/
└── .gitkeep                          # LangChain agent implementation (to be filled by Farhana)
```

---

## Pipeline (`pipeline/`)

### Kinesis Consumer (`pipeline/kinesis_consumer/`)
```
pipeline/kinesis_consumer/
└── .gitkeep                          # Kinesis consumer Lambda code (to be filled)
```

### Lambda Functions (`pipeline/lambda_functions/`)
```
pipeline/lambda_functions/
└── .gitkeep                          # Lambda function implementations (to be filled)
```

---

## ML (`ml/`)

### Anomaly Detection (`ml/anomaly_detection/`)
```
ml/anomaly_detection/
└── .gitkeep                          # Isolation Forest anomaly detection model (to be filled)
```

---

## GitHub (`/.github/`)

### Workflows (`/.github/workflows/`)
```
.github/workflows/
└── .gitkeep                          # CI/CD pipelines (to be filled)
```

---

## Git (`/.git/`)
```
.git/
├── hooks/                            # Git hooks (pre-commit, post-update, etc.)
├── objects/                          # Git object database
├── refs/                             # Git branch and tag references
└── logs/                             # Git reflog
```

---

## Summary

### File Count by Type
- **Python Files:** 30+ (backend, scripts, simulator)
- **TypeScript/React Files:** 20+ (frontend)
- **Terraform Files:** 10+ (infrastructure)
- **Configuration Files:** 15+ (env, docker-compose, tsconfig, etc.)
- **Documentation Files:** 4 (README, knowledge base, structure docs)
- **Test Files:** 2 (conftest, test_vehicles)

### Technology Stack by Directory
| Directory | Tech Stack |
|-----------|-----------|
| `backend/` | FastAPI, Pydantic, Boto3, Redis, Celery, JWT |
| `frontend/` | React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Chart.js, Zustand |
| `infra/terraform/` | Terraform, AWS (DynamoDB, Kinesis, Lambda, IoT Core, ECS, ECR) |
| `simulator/` | Python, Paho MQTT, Faker |
| `monitoring/` | Prometheus, Grafana, Loki |
| `agent/` | LangChain, LangGraph, Claude API |

### Key Integration Points
1. **Backend ↔ Frontend:** REST API + Socket.io WebSocket
2. **Backend ↔ Redis:** Cache vehicle locations, alert counts
3. **Backend ↔ DynamoDB:** Store vehicles, trips, alerts, drivers
4. **Simulator ↔ IoT Core:** MQTT GPS data
5. **IoT Core ↔ Kinesis:** Real-time GPS stream
6. **Kinesis ↔ Lambda:** Process GPS, detect anomalies
7. **Lambda ↔ DynamoDB:** Write alerts, vehicle updates
8. **Lambda ↔ Redis:** Update vehicle locations
9. **Lambda ↔ SNS:** Publish alerts
10. **SNS ↔ Twilio:** Send WhatsApp/SMS
11. **Agent ↔ Backend:** Query vehicles, alerts, analytics
12. **Frontend ↔ Agent:** Chat interface

