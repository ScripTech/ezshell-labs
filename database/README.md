# EZShell Labs Database Setup

This directory contains the custom PostgreSQL database setup for EZShell Labs. The database is pre-configured with the application schema and can optionally create an initial admin user.

## Features

- **Pre-initialized Schema**: Database tables are created automatically using Drizzle ORM migrations
- **Admin User Creation**: Optional initial admin user setup during container initialization
- **Production Ready**: Optimized for deployment with proper health checks
- **Zero-Downtime Deployment**: Database is ready immediately when container starts

## Files

- `Dockerfile.db` - Custom PostgreSQL image with schema initialization
- `init-db.sh` - Database initialization script that runs on first startup
- `build-db.sh` - Build and test script for the database image
- `.env.docker` - Environment configuration for the database container

## Quick Start

### 1. Build the Database Image

```bash
./database/build-db.sh
```

### 2. Run the Database Container

```bash
docker run -d --name ezshell-postgres \
  -e POSTGRES_USER=ezshell_user \
  -e POSTGRES_PASSWORD=ezshell_password \
  -e POSTGRES_DB=ezshell_labs \
  -e ADMIN_EMAIL=admin@ezshell.local \
  -e ADMIN_PASSWORD=admin123! \
  -p 5432:5432 \
  ezshell-database:latest
```

### 3. Verify Database Setup

```bash
# Check if container is running
docker ps | grep ezshell-postgres

# Check database tables
docker exec ezshell-postgres psql -U ezshell_user -d ezshell_labs -c "\dt"

# Verify admin user
docker exec ezshell-postgres psql -U ezshell_user -d ezshell_labs -c "SELECT email, role FROM users WHERE role = 'admin';"
```

## Environment Variables

### Required Variables

- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name

### Optional Variables

- `ADMIN_EMAIL` - Email for initial admin user (default: admin@ezshell.local)
- `ADMIN_PASSWORD` - Password for initial admin user (default: admin123!)

## Integration with Docker Compose

The database is automatically integrated with the main application via `docker-compose.yaml`:

```yaml
postgres-db:
  build:
    context: .
    dockerfile: database/Dockerfile.db
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
    ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@ezshell.local}
    ADMIN_PASSWORD: ${ADMIN_PASSWORD:-admin123!}
```

## Schema Management

The database schema is managed through Drizzle ORM from the frontend:

1. **Schema Definition**: Located in `frontend/src/db/schemas/`
2. **Migrations**: Generated automatically with `drizzle-kit generate`
3. **Migration Files**: Located in `frontend/drizzle/`
4. **Migration Application**: Applied automatically during container initialization

## Deployment

During deployment, the database image is built automatically:

```bash
./scripts/deploy.sh --version latest
```

This ensures that:
1. Latest schema changes are included
2. Database is ready before backend services start
3. No manual migration steps are required

## Troubleshooting

### Container Won't Start

1. Check logs: `docker logs ezshell-postgres`
2. Verify environment variables are set correctly
3. Ensure no port conflicts (default: 5432)

### Schema Not Applied

1. Check initialization logs: `docker logs ezshell-postgres | grep "Initializing"`
2. Verify backend schema files are included in the build context
3. Rebuild the image: `./database/build-db.sh`

### Admin User Not Created

1. Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
2. Check for duplicate email conflicts
3. Review logs for bcrypt hashing errors

## Security Considerations

- **Password Hashing**: Admin passwords are hashed using bcryptjs with 12 salt rounds
- **Environment Variables**: Use secure values for production deployments
- **Network Access**: Database should only be accessible from application containers
- **Volume Persistence**: Data is persisted in Docker volumes for durability

## Development vs Production

### Development
- Uses local Docker builds
- Admin user created with default credentials
- Database accessible on host port 5438

### Production
- Should use environment-specific credentials
- Database should only be accessible within Docker network
- Regular backups should be configured

## Backup and Recovery

```bash
# Create backup
docker exec ezshell-postgres pg_dump -U ezshell_user ezshell_labs > backup.sql

# Restore backup
docker exec -i ezshell-postgres psql -U ezshell_user ezshell_labs < backup.sql
```
