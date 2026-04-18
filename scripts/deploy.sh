#!/bin/bash

# FleetPulse Deployment Script
# Supports both LocalStack (dev) and AWS (prod) deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker found"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose found"
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git found"
}

# Setup environment
setup_env() {
    print_header "Setting Up Environment"
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
            print_warning "Please edit .env with your configuration"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_success ".env already exists"
    fi
}

# Deploy LocalStack
deploy_localstack() {
    print_header "Deploying LocalStack Environment"
    
    print_warning "Starting services (this may take 1-2 minutes)..."
    docker-compose up -d
    
    print_warning "Waiting for services to be healthy..."
    sleep 30
    
    # Check if backend is healthy
    for i in {1..30}; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            print_success "Backend is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend failed to start"
            docker-compose logs backend
            exit 1
        fi
        echo "Waiting for backend... ($i/30)"
        sleep 2
    done
    
    # Initialize LocalStack
    print_warning "Initializing LocalStack resources..."
    docker-compose exec -T localstack bash /etc/localstack/init/ready.d/init-localstack.sh
    
    print_success "LocalStack deployment complete!"
    print_header "Service URLs"
    echo "Frontend:    http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "API Docs:    http://localhost:8000/docs"
    echo "Grafana:     http://localhost:3001 (admin/fleetpulse123)"
    echo "Prometheus:  http://localhost:9090"
    echo "LocalStack:  http://localhost:4566"
}

# Deploy AWS
deploy_aws() {
    print_header "Deploying to AWS"
    
    print_warning "This will deploy to AWS. Make sure you have:"
    echo "  - AWS CLI configured (aws configure)"
    echo "  - Terraform installed"
    echo "  - kubectl installed"
    echo "  - Helm installed"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "AWS deployment cancelled"
        return
    fi
    
    cd infra/terraform
    
    print_warning "Initializing Terraform..."
    terraform init
    
    print_warning "Planning infrastructure..."
    terraform plan -out=tfplan
    
    read -p "Apply Terraform plan? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Terraform apply cancelled"
        return
    fi
    
    print_warning "Applying infrastructure..."
    terraform apply tfplan
    
    print_success "AWS infrastructure deployed!"
    print_warning "Next steps:"
    echo "  1. Configure kubectl: aws eks update-kubeconfig --region ap-south-1 --name fleetpulse-prod"
    echo "  2. Deploy with Helm: helm install fleetpulse ./helm-charts -n fleetpulse"
    echo "  3. Setup ArgoCD for continuous deployment"
    
    cd ../..
}

# Seed data
seed_data() {
    print_header "Seeding Test Data"
    
    docker-compose exec -T backend python seed-tasks.py
    print_success "Test data seeded"
}

# Show logs
show_logs() {
    print_header "Showing Logs"
    docker-compose logs -f backend
}

# Stop services
stop_services() {
    print_header "Stopping Services"
    docker-compose down
    print_success "Services stopped"
}

# Clean up
cleanup() {
    print_header "Cleaning Up"
    
    read -p "This will delete all data. Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cleanup cancelled"
        return
    fi
    
    docker-compose down -v
    print_success "Cleanup complete"
}

# Main menu
show_menu() {
    echo ""
    echo "FleetPulse Deployment Menu"
    echo "=========================="
    echo "1. Deploy LocalStack (Development)"
    echo "2. Deploy AWS (Production)"
    echo "3. Seed Test Data"
    echo "4. Show Logs"
    echo "5. Stop Services"
    echo "6. Clean Up"
    echo "7. Exit"
    echo ""
}

# Main script
main() {
    print_header "FleetPulse Deployment Script"
    
    check_prerequisites
    setup_env
    
    while true; do
        show_menu
        read -p "Select option (1-7): " choice
        
        case $choice in
            1)
                deploy_localstack
                ;;
            2)
                deploy_aws
                ;;
            3)
                seed_data
                ;;
            4)
                show_logs
                ;;
            5)
                stop_services
                ;;
            6)
                cleanup
                ;;
            7)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Run main
main
