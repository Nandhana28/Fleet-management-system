.PHONY: up down build test lint seed sim health logs

# ─── Local Dev ────────────────────────────────────────────────────────────────

up:
	docker-compose up --build

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f fastapi

health:
	curl -s http://localhost:8000/health | python -m json.tool

# ─── Testing ──────────────────────────────────────────────────────────────────

test:
	docker-compose exec fastapi pytest backend/tests/ -v

test-ci:
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# ─── Code Quality ─────────────────────────────────────────────────────────────

lint:
	black backend/ shared/
	flake8 backend/ shared/

# ─── Data & Simulation ───────────────────────────────────────────────────────

seed:
	python scripts/seed_demo_data.py

sim:
	python simulator/gps_simulator.py

jwt:
	python scripts/generate_jwt.py

# ─── Infrastructure (Farhana's commands) ─────────────────────────────────────

infra-plan:
	cd infra/terraform && terraform plan

infra-apply:
	cd infra/terraform && terraform apply

infra-destroy:
	cd infra/terraform && terraform destroy

# ─── AWS Toggle ───────────────────────────────────────────────────────────────

use-localstack:
	@sed -i 's/USE_LOCALSTACK=false/USE_LOCALSTACK=true/' .env
	@echo "Switched to LocalStack"

use-aws:
	@sed -i 's/USE_LOCALSTACK=true/USE_LOCALSTACK=false/' .env
	@echo "Switched to real AWS — make sure your credentials are in .env"
