#!/bin/bash
set -eo pipefail

# EZShell Labs Database Reset Script
LOG_FILE="./logs/db-reset.log"
SCRIPT_NAME=$(basename "$0")

# Create logs directory if it doesn't exist
mkdir -p logs

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$SCRIPT_NAME] $1" | tee -a "$LOG_FILE"
}

# Check if .env file exists
check_env() {
    if [ ! -f "frontend/.env.local" ] && [ ! -f "frontend/.env" ]; then
        log "ERROR: No .env file found in frontend directory"
        log "Please create frontend/.env.local with database credentials"
        exit 1
    fi
}

# Load environment variables
load_env() {
    if [ -f "frontend/.env.local" ]; then
        log "Loading environment from frontend/.env.local"
        export $(grep -v '^#' frontend/.env.local | xargs)
    elif [ -f "frontend/.env" ]; then
        log "Loading environment from frontend/.env"
        export $(grep -v '^#' frontend/.env | xargs)
    fi
}

# Reset database using Docker
reset_database_docker() {
    log "Stopping and removing database container with volumes..."
    docker-compose down -v

    log "Starting fresh database container..."
    docker-compose up -d db

    log "Waiting for database to be ready..."
    sleep 10

    log "Running database migrations and seeding..."
    cd frontend
    npm run db:setup
    cd ..

    log "Database reset completed successfully!"
}

# Alternative: Reset database directly
reset_database_direct() {
    log "Resetting database directly via PostgreSQL commands..."

    # Drop and recreate database
    docker exec -it ezshell-db psql -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE IF EXISTS \"${POSTGRES_DB}\";" 2>/dev/null || true
    docker exec -it ezshell-db psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE \"${POSTGRES_DB}\";"

    log "Running database migrations and seeding..."
    cd frontend
    npm run db:setup
    cd ..

    log "Database reset completed successfully!"
}

# Complete system reset
reset_complete_system() {
    log "Performing complete system reset..."

    # Stop all services
    docker-compose down -v

    # Remove containers and clean up
    docker-compose rm -f 2>/dev/null || true
    docker volume prune -f

    # Start all services fresh
    docker-compose up -d

    # Wait for services to be ready
    sleep 15

    # Setup database
    cd frontend
    npm run db:setup
    cd ..

    log "Complete system reset completed successfully!"
}

# Clear browser sessions (instructions)
clear_browser_sessions() {
    log "==================================="
    log "IMPORTANT: Clear Browser Sessions"
    log "==================================="
    log "After database reset, users may still have valid JWT tokens in their browsers."
    log "To fully reset user sessions, please:"
    log "1. Clear browser cookies for your domain"
    log "2. Or use incognito/private browsing mode"
    log "3. Or restart your browser"
    log "4. Users will need to sign in again"
    log "==================================="
}

# Main function
main() {
    log "=================================="
    log "EZShell Labs Database Reset"
    log "=================================="

    check_env
    load_env

    echo "Select reset option:"
    echo "1) Reset database only (recommended)"
    echo "2) Reset database directly via PostgreSQL"
    echo "3) Complete system reset (all services)"
    echo "4) Cancel"

    read -p "Enter your choice (1-4): " choice

    case $choice in
        1)
            reset_database_docker
            ;;
        2)
            reset_database_direct
            ;;
        3)
            reset_complete_system
            ;;
        4)
            log "Reset cancelled by user"
            exit 0
            ;;
        *)
            log "Invalid choice. Exiting."
            exit 1
            ;;
    esac

    clear_browser_sessions
    log "Reset operation completed at $(date)"
}

# Run main function
main "$@"
