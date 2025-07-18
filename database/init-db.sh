#!/bin/bash
set -e

echo "🚀 Initializing EZShell Labs Database..."

# During docker-entrypoint-initdb.d execution, PostgreSQL is already running
# and we can connect directly without waiting
echo "✅ PostgreSQL is ready (running in init mode)!"

# Set up environment for schema operations
export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432

cd /app

echo "⏳ Generating database schema..."
# Generate the latest schema files
npm run db:generate

echo "⏳ Applying database migrations..."
# Apply migrations using drizzle
if npm run db:migrate; then
    echo "✅ Database migrations applied successfully!"
else
    echo "❌ Failed to apply migrations"
    exit 1
fi

echo "⏳ Seeding initial data..."
# Run seed script if it exists
if npm run db:seed 2>/dev/null; then
    echo "✅ Database seeded successfully!"
else
    echo "⚠️  No seed script found or seeding failed, continuing..."
fi

# Create initial admin user if specified
if [ ! -z "$ADMIN_EMAIL" ] && [ ! -z "$ADMIN_PASSWORD" ]; then
    echo "⏳ Creating initial admin user..."

    # Hash the password (basic bcrypt with salt rounds 12)
    HASHED_PASSWORD=$(node -e "
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('$ADMIN_PASSWORD', 12);
        console.log(hash);
    ")

    # Insert admin user
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        INSERT INTO users (id, email, password, role, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            '$ADMIN_EMAIL',
            '$HASHED_PASSWORD',
            'admin',
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
EOSQL

    echo "✅ Admin user created: $ADMIN_EMAIL"
fi

echo "🎉 EZShell Labs Database initialization completed!"
