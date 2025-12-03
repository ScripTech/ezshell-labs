#!/bin/bash
set -e

# Custom entrypoint for PostgreSQL with proper permission handling

# Function to handle PostgreSQL initialization
postgres_init() {
    # Ensure data directory exists and has proper permissions
    if [ ! -d "$PGDATA" ]; then
        echo "Creating PostgreSQL data directory at $PGDATA"
        mkdir -p "$PGDATA"
    fi

    # Set ownership to postgres user
    chown -R postgres:postgres "$PGDATA"
    chmod 0700 "$PGDATA"

    # Initialize database if it doesn't exist
    if [ ! -s "$PGDATA/PG_VERSION" ]; then
        echo "Initializing PostgreSQL database..."
        initdb --username="$POSTGRES_USER" --pwfile=<(echo "$POSTGRES_PASSWORD") --auth-local=trust --auth-host=md5

        # Start temporary PostgreSQL server for initialization
        pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -p 5432" -w start

        # Create database and user
        psql --username="$POSTGRES_USER" --dbname=postgres <<-EOSQL
            CREATE DATABASE $POSTGRES_DB;
            \c $POSTGRES_DB;
EOSQL

        # Run initialization scripts
        if [ -d /docker-entrypoint-initdb.d ]; then
            for f in /docker-entrypoint-initdb.d/*; do
                case "$f" in
                    *.sh)     echo "Running $f"; . "$f" ;;
                    *.sql)    echo "Running $f"; psql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" -f "$f"; echo ;;
                    *.sql.gz) echo "Running $f"; gunzip -c "$f" | psql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"; echo ;;
                    *)        echo "Ignoring $f" ;;
                esac
                echo
            done
        fi

        # Stop temporary server
        pg_ctl -D "$PGDATA" -m fast -w stop
    fi
}

# Main execution
if [ "$1" = 'postgres' ]; then
    # Set default environment variables if not provided
    export POSTGRES_USER="${POSTGRES_USER:-ezshell_user}"
    export POSTGRES_DB="${POSTGRES_DB:-ezshell_labs}"
    export PGDATA="${PGDATA:-/var/lib/postgresql/data}"

    # Initialize PostgreSQL
    postgres_init

    # Start PostgreSQL server
    exec postgres -D "$PGDATA" -c config_file="$PGDATA/postgresql.conf"
else
    # Run other commands as specified
    exec "$@"
fi
