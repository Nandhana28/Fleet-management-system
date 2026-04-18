.PHONY: help up down logs health seed clean restart test lint format

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)FleetPulse Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Deployment:$(NC)"
	@echo "  make up              - Start all services (LocalStack)"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Restart all services"
	@echo "  make clean           - Remove all containers and volumes"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make logs            - Show backend logs"
	@echo "  make logs-frontend   - Show frontend logs"
	@echo "  make logs-all        - Show all logs"
	@echo "  make health          - Check service health"
	@echo "  make seed            - Seed test data"
	@echo ""
	@echo "$(GREEN)Testing & Quality:$(NC)"
	@echo "  make test            - Run backend tests"
	@echo "  make test-frontend   - Run frontend tests"
	@echo "  make lint            - Run linters"
	@echo "  make format          - Format code"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make migrate         - Run database migrations"
	@echo "  make db-shell        - Open database shell"
	@echo ""
	@echo "$(GREEN)Monitoring:$(NC)"
	@echo "  make metrics         - Show Prometheus metrics"
	@echo "  make grafana         - Open Grafana dashboard"
	@echo ""

# Setup & Deployment
up:
	@echo "$(BLUE)Starting FleetPulse services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Frontend:    http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "Grafana:     http://localhost:3001"

down:
	@echo "$(BLUE)Stopping services...$(NC)"
	docker-compose down
	@echo "$(GREEN)Services stopped$(NC)"

restart:
	@echo "$(BLUE)Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)Services restarted$(NC)"

clean:
	@echo "$(BLUE)Cleaning up...$(NC)"
	docker-compose down -v
	@echo "$(GREEN)Cleanup complete$(NC)"

# Development
logs:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-all:
	docker-compose logs -f

health:
	@echo "$(BLUE)Checking service health...$(NC)"
	@docker-compose ps
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:8000/health | jq . || echo "Backend not responding"

seed:
	@echo "$(BLUE)Seeding test data...$(NC)"
	docker-compose exec backend python seed-tasks.py
	@echo "$(GREEN)Test data seeded$(NC)"

# Testing & Quality
test:
	@echo "$(BLUE)Running backend tests...$(NC)"
	docker-compose exec backend pytest tests/ -v

test-frontend:
	@echo "$(BLUE)Running frontend tests...$(NC)"
	docker-compose exec frontend npm test

lint:
	@echo "$(BLUE)Running linters...$(NC)"
	docker-compose exec backend pylint app/
	docker-compose exec frontend npm run lint

format:
	@echo "$(BLUE)Formatting code...$(NC)"
	docker-compose exec backend black app/
	docker-compose exec backend isort app/
	docker-compose exec frontend npm run format

# Database
migrate:
	@echo "$(BLUE)Running migrations...$(NC)"
	docker-compose exec backend python -m alembic upgrade head
	@echo "$(GREEN)Migrations complete$(NC)"

db-shell:
	@echo "$(BLUE)Opening database shell...$(NC)"
	docker-compose exec backend python

# Monitoring
metrics:
	@echo "$(BLUE)Prometheus metrics:$(NC)"
	@curl -s http://localhost:9090/api/v1/query?query=up | jq .

grafana:
	@echo "$(BLUE)Opening Grafana...$(NC)"
	@open http://localhost:3001 || xdg-open http://localhost:3001 || echo "Open http://localhost:3001 in your browser"

# Build
build:
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build

build-prod:
	@echo "$(BLUE)Building production images...$(NC)"
	docker build -t fleetpulse-backend:latest -f backend/Dockerfile .
	docker build -t fleetpulse-frontend:latest -f frontend/Dockerfile ./frontend

# Push to registry
push:
	@echo "$(BLUE)Pushing images to registry...$(NC)"
	@echo "Set REGISTRY environment variable"
	docker tag fleetpulse-backend:latest $${REGISTRY}/fleetpulse-backend:latest
	docker tag fleetpulse-frontend:latest $${REGISTRY}/fleetpulse-frontend:latest
	docker push $${REGISTRY}/fleetpulse-backend:latest
	docker push $${REGISTRY}/fleetpulse-frontend:latest

# AWS Deployment
aws-init:
	@echo "$(BLUE)Initializing AWS infrastructure...$(NC)"
	cd infra/terraform && terraform init

aws-plan:
	@echo "$(BLUE)Planning AWS infrastructure...$(NC)"
	cd infra/terraform && terraform plan -out=tfplan

aws-apply:
	@echo "$(BLUE)Applying AWS infrastructure...$(NC)"
	cd infra/terraform && terraform apply tfplan

aws-destroy:
	@echo "$(BLUE)Destroying AWS infrastructure...$(NC)"
	cd infra/terraform && terraform destroy

# Utilities
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend bash

shell-localstack:
	docker-compose exec localstack bash

ps:
	docker-compose ps

version:
	@echo "FleetPulse v1.0.0"
	@echo "Backend: FastAPI"
	@echo "Frontend: React"
	@echo "Database: DynamoDB (LocalStack)"
	@echo "Cache: Redis"
	@echo "Monitoring: Prometheus + Grafana + Loki"
