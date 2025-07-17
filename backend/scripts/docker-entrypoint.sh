#!/bin/sh

# Docker entrypoint script for backend
# This script runs database migrations before starting the server

set -e

echo "🚀 Starting EZShell Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
while ! nc -z ${POSTGRES_HOST:-localhost} ${POSTGRES_PORT:-5432}; do
  echo "Database not ready, waiting..."
  sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "⏳ Running database migrations..."
if npm run db:migrate; then
  echo "✅ Database migrations completed successfully!"
else
  echo "❌ Database migrations failed!"
  exit 1
fi

# Start the application
echo "🎯 Starting the application..."
exec "$@"
