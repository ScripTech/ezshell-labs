#!/bin/bash
set -e

echo "🚀 Initializing EZShell Labs Database..."

# Apply all SQL migrations in order
echo "⏳ Applying database migrations..."

# Find and apply all SQL migration files in chronological order
for sql_file in $(ls /app/drizzle/*.sql | sort); do
    echo "Applying migration: $(basename $sql_file)"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$sql_file"
done

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
