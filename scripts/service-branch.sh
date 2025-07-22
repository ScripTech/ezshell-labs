#!/bin/bash

# Service Branch Management Script
# Usage: ./scripts/service-branch.sh <service> [action]
# Services: frontend, backend, database, lab-provisioner
# Actions: create, switch, status, push

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Service Branch Management Script"
    echo ""
    echo "Usage: $0 <service> [action]"
    echo ""
    echo "Services:"
    echo "  frontend         - Frontend Next.js application"
    echo "  backend          - Backend Node.js API"
    echo "  database         - PostgreSQL database setup"
    echo "  lab-provisioner  - Lab provisioning microservice"
    echo ""
    echo "Actions:"
    echo "  create    - Create and switch to service branch"
    echo "  switch    - Switch to existing service branch"
    echo "  status    - Show branch status and recent commits"
    echo "  push      - Push current branch to origin"
    echo "  sync      - Sync with develop branch"
    echo ""
    echo "Examples:"
    echo "  $0 frontend create    # Create service-frontend branch"
    echo "  $0 backend switch     # Switch to service-backend branch"
    echo "  $0 database status    # Show database branch status"
    echo "  $0 lab-provisioner push  # Push lab-provisioner changes"
}

# Validate service name
validate_service() {
    local service=$1
    case $service in
        frontend|backend|database|lab-provisioner)
            return 0
            ;;
        *)
            print_error "Invalid service: $service"
            show_usage
            exit 1
            ;;
    esac
}

# Create service branch
create_branch() {
    local service=$1
    local branch_name="service-$service"
    
    print_status "Creating branch: $branch_name"
    
    # Check if branch already exists
    if git show-ref --verify --quiet refs/heads/$branch_name; then
        print_warning "Branch $branch_name already exists locally"
        read -p "Switch to existing branch? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            switch_branch $service
        fi
        return
    fi
    
    # Create branch from develop
    git checkout develop
    git pull origin develop
    git checkout -b $branch_name
    
    print_success "Created and switched to branch: $branch_name"
    print_status "Push to origin with: git push -u origin $branch_name"
}

# Switch to service branch
switch_branch() {
    local service=$1
    local branch_name="service-$service"
    
    print_status "Switching to branch: $branch_name"
    
    if ! git show-ref --verify --quiet refs/heads/$branch_name; then
        print_error "Branch $branch_name does not exist locally"
        read -p "Create new branch? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_branch $service
        fi
        return
    fi
    
    git checkout $branch_name
    print_success "Switched to branch: $branch_name"
}

# Show branch status
show_status() {
    local service=$1
    local branch_name="service-$service"
    
    print_status "Status for service: $service"
    echo ""
    
    # Check if branch exists
    if git show-ref --verify --quiet refs/heads/$branch_name; then
        echo "📋 Branch: $branch_name (exists locally)"
        
        # Check if current branch
        current_branch=$(git rev-parse --abbrev-ref HEAD)
        if [ "$current_branch" = "$branch_name" ]; then
            echo "✅ Currently on this branch"
        else
            echo "⚪ Not currently on this branch (on: $current_branch)"
        fi
        
        # Check remote tracking
        if git show-ref --verify --quiet refs/remotes/origin/$branch_name; then
            echo "🌐 Remote: exists on origin"
            
            # Check if up to date
            git fetch origin $branch_name --quiet
            LOCAL=$(git rev-parse $branch_name)
            REMOTE=$(git rev-parse origin/$branch_name)
            
            if [ "$LOCAL" = "$REMOTE" ]; then
                echo "✅ Up to date with origin"
            else
                echo "⚠️  Out of sync with origin"
            fi
        else
            echo "❌ Remote: not pushed to origin"
        fi
        
        echo ""
        echo "📝 Recent commits on $branch_name:"
        git log --oneline -5 $branch_name
        
        echo ""
        echo "📊 Branch comparison with develop:"
        AHEAD=$(git rev-list --count develop..$branch_name 2>/dev/null || echo "0")
        BEHIND=$(git rev-list --count $branch_name..develop 2>/dev/null || echo "0")
        echo "   Ahead: $AHEAD commits"
        echo "   Behind: $BEHIND commits"
        
    else
        echo "❌ Branch: $branch_name (does not exist locally)"
        echo "   Use: $0 $service create"
    fi
    
    echo ""
    echo "🔧 Service directory: $service/"
    if [ -d "$PROJECT_ROOT/$service" ]; then
        echo "✅ Service directory exists"
        
        # Show recent changes in service directory
        echo ""
        echo "📁 Recent changes in $service/:"
        git log --oneline -3 --follow -- $service/ 2>/dev/null || echo "   No commits found for $service/"
    else
        echo "❌ Service directory not found"
    fi
}

# Push current branch
push_branch() {
    local service=$1
    local branch_name="service-$service"
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$current_branch" != "$branch_name" ]; then
        print_error "Not currently on $branch_name branch (on: $current_branch)"
        read -p "Switch to $branch_name and push? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            switch_branch $service
        else
            return
        fi
    fi
    
    print_status "Pushing $branch_name to origin..."
    
    # Check if remote branch exists
    if git show-ref --verify --quiet refs/remotes/origin/$branch_name; then
        git push origin $branch_name
    else
        git push -u origin $branch_name
        print_success "Branch pushed and upstream set"
    fi
    
    print_success "Pushed $branch_name to origin"
    print_status "GitHub Actions will now build the $service service"
}

# Sync with develop
sync_branch() {
    local service=$1
    local branch_name="service-$service"
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$current_branch" != "$branch_name" ]; then
        print_error "Not currently on $branch_name branch"
        return 1
    fi
    
    print_status "Syncing $branch_name with develop..."
    
    # Fetch latest changes
    git fetch origin develop
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_error "You have uncommitted changes. Please commit or stash them first."
        return 1
    fi
    
    # Merge develop into service branch
    git merge origin/develop
    
    print_success "Synced $branch_name with develop"
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    local service=$1
    local action=${2:-"status"}
    
    validate_service $service
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    case $action in
        create)
            create_branch $service
            ;;
        switch)
            switch_branch $service
            ;;
        status)
            show_status $service
            ;;
        push)
            push_branch $service
            ;;
        sync)
            sync_branch $service
            ;;
        *)
            print_error "Invalid action: $action"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
