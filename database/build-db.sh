#!/bin/bash

# Build script for EZShell Labs Database Container
# This script builds a custom PostgreSQL image with pre-initialized schema

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "🚀 Building EZShell Labs Database Container..."

# Check if Dockerfile exists
if [ ! -f "database/Dockerfile.db" ]; then
    log_error "database/Dockerfile.db not found!"
    exit 1
fi

# Check if backend schema files exist
if [ ! -d "frontend/src/db" ]; then
    log_error "Frontend database schema files not found!"
    exit 1
fi

# Build the database image
log_info "Building database image..."
if docker build -f database/Dockerfile.db -t ezshell-database:latest --load .; then
    log_info "✅ Database image built successfully!"
else
    log_error "❌ Failed to build database image"
    exit 1
fi

# Test the database container
log_info "Testing database container..."
if docker run --rm -d \
    --name ezshell-db-test \
    -e POSTGRES_USER=test_user \
    -e POSTGRES_PASSWORD=test_password \
    -e POSTGRES_DB=test_db \
    -e ADMIN_EMAIL=test@example.com \
    -e ADMIN_PASSWORD=test123 \
    ezshell-database:latest; then

    log_info "Database container started, waiting for initialization..."
    sleep 30

    # Check if the container is still running
    if docker ps | grep -q ezshell-db-test; then
        log_info "✅ Database container is running successfully!"

        # Check if tables were created
        if docker exec ezshell-db-test psql -U test_user -d test_db -c "\dt" | grep -q "users"; then
            log_info "✅ Database schema initialized successfully!"
        else
            log_warn "⚠️  Could not verify schema initialization"
        fi

        # Stop test container
        docker stop ezshell-db-test
    else
        log_error "❌ Database container failed to start properly"
        docker logs ezshell-db-test
        exit 1
    fi
else
    log_error "❌ Failed to start database container"
    exit 1
fi

log_info "🎉 Database container build and test completed successfully!"
log_info ""
log_info "To use the database:"
log_info "  docker run -d --name ezshell-postgres \\"
log_info "    -e POSTGRES_USER=ezshell_user \\"
log_info "    -e POSTGRES_PASSWORD=ezshell_password \\"
log_info "    -e POSTGRES_DB=ezshell_labs \\"
log_info "    -e ADMIN_EMAIL=admin@ezshell.local \\"
log_info "    -e ADMIN_PASSWORD=admin123! \\"
log_info "    -p 5432:5432 \\"
log_info "    ezshell-database:latest"
