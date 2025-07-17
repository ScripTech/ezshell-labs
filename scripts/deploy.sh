#!/bin/bash

# EZShell Labs Deployment Script
# This script helps deploy EZShell Labs to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
REPO_NAME="scriptech/ezshell-labs"
DEFAULT_VERSION="latest"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --version VERSION    Specify version to deploy (default: latest)"
    echo "  -e, --env-file FILE      Environment file to use (default: .env.prod)"
    echo "  -p, --pull               Pull latest images before deployment"
    echo "  -b, --backup             Create database backup before deployment"
    echo "  -r, --rollback VERSION   Rollback to specific version"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --version v1.0.0 --backup"
    echo "  $0 --rollback v0.9.0"
    echo "  $0 --pull --env-file .env.staging"
}

create_env_template() {
    cat > .env.prod.template << EOF
# EZShell Labs Production Environment Configuration

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ezshell_labs
POSTGRES_PASSWORD=your_secure_password

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret_key_here
JWT_SECRET=your_jwt_secret_key_here

# SSH Configuration
SSH_HOST=your_ssh_host
SSH_USER=your_ssh_user
SSH_PASSWORD=your_ssh_password

# Domain Configuration (for Traefik)
FRONTEND_DOMAIN=your-frontend-domain.com
BACKEND_DOMAIN=api.your-domain.com

# SSL Configuration
ACME_EMAIL=your-email@domain.com

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
EOF
    log_info "Created .env.prod.template - Please configure your environment variables"
}

backup_database() {
    log_info "Creating database backup..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

    if docker-compose exec -T postgres-db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "$BACKUP_FILE"; then
        log_info "Database backup created: $BACKUP_FILE"
    else
        log_error "Failed to create database backup"
        exit 1
    fi
}

build_database() {
    log_info "Building custom database image..."
    if ./database/build-db.sh; then
        log_info "✅ Database image built successfully!"
    else
        log_error "❌ Failed to build database image"
        exit 1
    fi
}

pull_images() {
    log_info "Pulling latest Docker images..."
    docker pull "$REGISTRY/$REPO_NAME-frontend:$VERSION"
    docker pull "$REGISTRY/$REPO_NAME-backend:$VERSION"
    docker pull "$REGISTRY/$REPO_NAME-shell-node:$VERSION"
}

deploy() {
    log_info "Deploying EZShell Labs version: $VERSION"

    # Build custom database image with pre-initialized schema
    build_database

    # Set image versions in environment
    export FRONTEND_IMAGE="$REGISTRY/$REPO_NAME-frontend:$VERSION"
    export BACKEND_IMAGE="$REGISTRY/$REPO_NAME-backend:$VERSION"
    export SHELL_NODE_IMAGE="$REGISTRY/$REPO_NAME-shell-node:$VERSION"

    # Deploy with docker-compose
    if docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d; then
        log_info "Deployment successful!"

        # Wait for services to be ready
        log_info "Waiting for services to be ready..."
        sleep 30

        # Health check
        if curl -f "http://localhost:3000/api/health" >/dev/null 2>&1; then
            log_info "Frontend health check passed"
        else
            log_warn "Frontend health check failed - please verify manually"
        fi

        if curl -f "http://localhost:3001/health" >/dev/null 2>&1; then
            log_info "Backend health check passed"
        else
            log_warn "Backend health check failed - please verify manually"
        fi

        log_info "Deployment completed successfully!"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

rollback() {
    log_warn "Rolling back to version: $ROLLBACK_VERSION"
    VERSION="$ROLLBACK_VERSION"
    deploy
}

# Parse command line arguments
VERSION="$DEFAULT_VERSION"
ENV_FILE=".env.prod"
PULL_IMAGES=false
CREATE_BACKUP=false
ROLLBACK_VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -e|--env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        -p|--pull)
            PULL_IMAGES=true
            shift
            ;;
        -b|--backup)
            CREATE_BACKUP=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
log_info "EZShell Labs Deployment Script"
echo "================================"

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    log_warn "Environment file $ENV_FILE not found"
    if [[ "$ENV_FILE" == ".env.prod" ]]; then
        log_info "Creating environment template..."
        create_env_template
        log_error "Please configure $ENV_FILE and run again"
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Handle rollback
if [[ -n "$ROLLBACK_VERSION" ]]; then
    rollback
    exit 0
fi

# Create backup if requested
if [[ "$CREATE_BACKUP" == true ]]; then
    backup_database
fi

# Pull images if requested
if [[ "$PULL_IMAGES" == true ]]; then
    pull_images
fi

# Deploy
deploy

log_info "Deployment script completed!"
