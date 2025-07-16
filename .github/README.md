# GitHub Actions CI/CD Documentation

This directory contains GitHub Actions workflows for automated building, testing, and deployment of EZShell Labs.

## Workflows Overview

### 1. `docker-build.yml` - Docker Build and Push
**Triggers:** Push to main/develop, tags, pull requests
**Purpose:** Build and push Docker images to GitHub Container Registry

#### Features:
- Multi-platform builds (AMD64, ARM64)
- Automated tagging based on branch/tag
- Build caching for faster builds
- Separate builds for frontend, backend, and shell-node

#### Images Built:
- `ghcr.io/scriptech/ezshell-labs-frontend`
- `ghcr.io/scriptech/ezshell-labs-backend`
- `ghcr.io/scriptech/ezshell-labs-shell-node`

### 2. `ci-cd.yml` - Continuous Integration Pipeline
**Triggers:** Push to main/develop, pull requests
**Purpose:** Run tests, linting, and quality checks

#### Features:
- Frontend testing and linting
- Backend testing with PostgreSQL
- Type checking for TypeScript
- Security scanning with Trivy
- Automatic Docker build trigger on success

### 3. `deploy.yml` - Production Deployment
**Triggers:** Release published, manual dispatch
**Purpose:** Deploy to production environment

#### Features:
- Environment-specific deployments
- Deployment package creation
- Health checks after deployment
- Rollback capability

### 4. `security.yml` - Security and Dependency Management
**Triggers:** Weekly schedule, manual dispatch
**Purpose:** Security scanning and dependency updates

#### Features:
- Dependency vulnerability scanning
- Automated dependency updates
- Docker image security scanning
- SARIF upload to GitHub Security tab

## Setup Instructions

### 1. Repository Configuration

#### Required Secrets:
```bash
# Optional: For Snyk scanning
SNYK_TOKEN=your_snyk_token

# For deployment (if using automated deployment)
DEPLOY_HOST=your_server_host
DEPLOY_USER=your_deploy_user
DEPLOY_KEY=your_ssh_private_key

# Application secrets
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_production_database_url
```

#### Required Variables:
```bash
# Application URLs (for health checks)
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
```

### 2. Package Registry Setup

The workflows use GitHub Container Registry (ghcr.io) by default. Ensure your repository has:
- Package permissions enabled
- Container registry access configured

### 3. Branch Protection

Recommended branch protection rules:
- Require status checks to pass
- Require branches to be up to date
- Require review before merging
- Include administrators

## Workflow Triggers

### Automatic Triggers:
- **Push to main/develop**: Full CI/CD pipeline
- **Pull Requests**: CI pipeline only
- **Tags (v*)**: Full build and potential deployment
- **Weekly Schedule**: Security and dependency updates

### Manual Triggers:
- **workflow_dispatch**: All workflows support manual triggering
- **Environment Selection**: Deploy workflow allows environment choice

## Docker Images

### Image Naming Convention:
```
ghcr.io/scriptech/ezshell-labs-{component}:{tag}
```

### Available Tags:
- `latest`: Latest from main branch
- `develop`: Latest from develop branch
- `v1.0.0`: Specific version tags
- `pr-123`: Pull request builds

### Multi-platform Support:
All images are built for:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, Apple Silicon)

## Deployment Process

### Automated Deployment (Production):
1. Create a release on GitHub
2. Workflow automatically builds and deploys
3. Health checks verify deployment
4. Notification of success/failure

### Manual Deployment:
1. Go to Actions → Production Deployment
2. Click "Run workflow"
3. Select environment (staging/production)
4. Monitor deployment progress

### Using the Deployment Script:
```bash
# Deploy specific version with backup
./scripts/deploy.sh --version v1.0.0 --backup

# Deploy latest with image pull
./scripts/deploy.sh --pull --env-file .env.staging

# Rollback to previous version
./scripts/deploy.sh --rollback v0.9.0
```

## Environment Configuration

### Development:
```yaml
NODE_ENV: development
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ezshell_dev
```

### Staging:
```yaml
NODE_ENV: staging
DATABASE_URL: postgresql://user:pass@staging-db:5432/ezshell_staging
NEXTAUTH_URL: https://staging.ezshell.dev
```

### Production:
```yaml
NODE_ENV: production
DATABASE_URL: postgresql://user:pass@prod-db:5432/ezshell_production
NEXTAUTH_URL: https://ezshell.dev
```

## Monitoring and Alerts

### GitHub Actions Notifications:
- Email notifications for failed workflows
- Slack integration (if configured)
- Discord webhooks (if configured)

### Security Alerts:
- Dependabot security updates
- Trivy vulnerability scans
- SARIF uploads to Security tab

## Troubleshooting

### Common Issues:

#### 1. Docker Build Failures:
```bash
# Check Dockerfile syntax
docker build -t test-image .

# Verify base image availability
docker pull node:18-alpine
```

#### 2. Test Failures:
```bash
# Run tests locally
cd frontend && npm test
cd backend && npm test

# Check test environment
echo $DATABASE_URL
```

#### 3. Deployment Issues:
```bash
# Check environment variables
cat .env.prod

# Verify Docker Compose
docker-compose config

# Check service health
curl -f http://localhost:3000/api/health
```

### Debug Mode:
Enable debug logging by setting:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## Best Practices

### 1. Branch Strategy:
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Emergency fixes

### 2. Commit Messages:
```
feat: add new validation system
fix: resolve authentication bug
docs: update API documentation
chore: update dependencies
```

### 3. Release Process:
1. Merge to develop
2. Test in staging environment
3. Create release from main
4. Tag with semantic version
5. Deploy to production

### 4. Security:
- Regular dependency updates
- Security scanning on every build
- Encrypted secrets management
- Minimal container privileges

## Performance Optimization

### Build Optimization:
- Multi-stage Docker builds
- Layer caching
- Parallel job execution
- Artifact reuse

### Deployment Optimization:
- Blue-green deployments
- Rolling updates
- Health check monitoring
- Automatic rollback triggers

## Contributing

When adding new workflows:
1. Follow existing naming conventions
2. Add comprehensive documentation
3. Test in development first
4. Update this README
5. Consider security implications

## Support

For workflow issues:
- Check Actions tab for detailed logs
- Review workflow YAML syntax
- Verify repository settings
- Contact repository maintainers
