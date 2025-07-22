# Service-Specific Build System

This repository uses a service-specific build system that automatically builds Docker images based on branch names. This approach allows for efficient CI/CD with targeted builds and deployments.

## 🏗️ Branch Structure

### Service Branches
- `service-frontend` - Frontend Next.js application
- `service-backend` - Backend Node.js API server  
- `service-database` - PostgreSQL database configuration
- `service-lab-provisioner` - Lab provisioning microservice

### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch for development

## 🚀 Automated Builds

### GitHub Actions Workflows

#### 1. Service-Specific Builds (`service-builds.yml`)
Triggers when pushing to service branches:
- Detects service from branch name
- Runs service-specific tests and validation
- Builds and pushes Docker images to AWS ECR
- Only builds the specific service that changed

#### 2. Service Branch Protection (`service-protection.yml`)
Runs on pull requests to service branches:
- Validates that changes are relevant to the target service
- Runs comprehensive testing for the specific service
- Adds automated comments to PRs with validation results
- Ensures code quality before merging

### Build Matrix

| Branch | Service | Docker Image | Tests |
|--------|---------|--------------|-------|
| `service-frontend` | Frontend | `ezshell/frontend` | ✅ TypeScript, Lint, Build |
| `service-backend` | Backend | `ezshell/backend` | ✅ Jest, Coverage, Lint |
| `service-database` | Database | `ezshell/database` | ✅ Dockerfile validation |
| `service-lab-provisioner` | Lab Provisioner | `ezshell/lab-provisioner` | ✅ Jest, TypeScript, Build |

## 🛠️ Usage

### Using the Service Branch Script

We provide a helper script to manage service branches:

```bash
# Create and switch to frontend service branch
./scripts/service-branch.sh frontend create

# Switch to existing backend branch
./scripts/service-branch.sh backend switch

# Check status of database service branch
./scripts/service-branch.sh database status

# Push lab-provisioner changes
./scripts/service-branch.sh lab-provisioner push

# Sync service branch with develop
./scripts/service-branch.sh frontend sync
```

### Manual Branch Management

```bash
# Create service branch
git checkout develop
git pull origin develop
git checkout -b service-frontend

# Make your changes to frontend/
# Commit and push
git add frontend/
git commit -m "feat: update frontend component"
git push -u origin service-frontend
```

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create service branch
./scripts/service-branch.sh frontend create

# Make changes to frontend/
# Commit changes
git add frontend/
git commit -m "feat: add new feature"

# Push to trigger build
./scripts/service-branch.sh frontend push
```

### 2. Code Review
```bash
# Create pull request from service-frontend to develop
# GitHub Actions will:
# - Validate frontend-specific changes
# - Run frontend tests
# - Add automated PR comments
```

### 3. Integration
```bash
# After PR approval, merge to develop
# Then merge develop to main for production deployment
```

## 📊 Build Optimization

### Selective Building
- Only builds services with actual changes
- Reduces build time and resource usage
- Parallel builds for independent services

### Caching Strategy
- Docker layer caching in ECR
- Node.js dependency caching
- Reuse of unchanged service images

### Security
- Automated security audits via `npm audit`
- Dependency vulnerability scanning
- Image scanning in ECR

## 🔍 Monitoring

### Build Status
- Real-time build status in GitHub Actions
- Slack/email notifications for build failures
- Coverage reports for backend services

### Deployment Tracking
- Automated deployment to staging environments
- Blue-green deployment for production
- Rollback capabilities with previous image tags

## 🎯 Best Practices

### Branch Naming
- Always use `service-` prefix for service branches
- Keep service branches focused on single service changes
- Sync regularly with develop to avoid conflicts

### Commit Messages
- Use conventional commit format: `feat:`, `fix:`, `chore:`
- Include service scope: `feat(frontend): add new component`
- Reference issue numbers when applicable

### Testing
- Run local tests before pushing
- Ensure service-specific tests pass
- Update tests when adding new features

### Dependencies
- Keep dependencies up to date
- Use exact versions for production dependencies
- Regular security audits

## 🚨 Troubleshooting

### Build Failures
```bash
# Check build logs in GitHub Actions
# Local debugging:
cd frontend/  # or backend/, database/, lab-provisioner/
npm run build
npm run test
```

### Branch Conflicts
```bash
# Sync service branch with develop
./scripts/service-branch.sh frontend sync

# Or manually:
git fetch origin develop
git merge origin/develop
```

### Docker Issues
```bash
# Test Docker build locally
cd frontend/
docker build -t test-frontend .

# Check for multi-platform issues
docker buildx build --platform linux/amd64,linux/arm64 .
```

## 📝 Configuration

### Environment Variables
Each service has its own environment configuration:
- `frontend/.env.docker` - Frontend production config
- `backend/.env.docker` - Backend production config  
- `lab-provisioner/.env` - Lab provisioner config

### AWS ECR Repositories
- `625572953030.dkr.ecr.us-west-2.amazonaws.com/ezshell/frontend`
- `625572953030.dkr.ecr.us-west-2.amazonaws.com/ezshell/backend`
- `625572953030.dkr.ecr.us-west-2.amazonaws.com/ezshell/database`
- `625572953030.dkr.ecr.us-west-2.amazonaws.com/ezshell/lab-provisioner`

## 🔗 Related Documentation

- [Docker Compose Setup](../docker-compose.prod.yml)
- [GitHub Actions Workflows](../.github/workflows/)
- [Service Deployment Guide](./DEPLOYMENT.md)
- [Environment Configuration](./ENVIRONMENT.md)

---

*This service-specific build system ensures efficient, targeted deployments while maintaining code quality and security standards.*
