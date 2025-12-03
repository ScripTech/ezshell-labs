#!/bin/bash
set -e

echo "🚀 Initializing EZShell Labs Database..."

# Apply all SQL migrations in order
echo "⏳ Applying database migrations..."

# Apply migrations in chronological order
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /app/drizzle/20250714163421_majestic_the_spike.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /app/drizzle/20250714165854_conscious_viper.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /app/drizzle/20250714170923_nebulous_doomsday.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /app/drizzle/20250714180123_little_silver_centurion.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /app/drizzle/20250714192103_yielding_norman_osborn.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /app/drizzle/20250716220941_outstanding_zzzax.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /app/drizzle/20250717183040_jazzy_raider.sql

echo "✅ Database migrations applied successfully!"

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
        INSERT INTO "user" (id, email, password, role, created_at, updated_at)
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
