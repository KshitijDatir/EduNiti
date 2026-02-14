#!/bin/bash
# Creates additional databases beyond the default POSTGRES_DB.
# This runs automatically on first Postgres start (when the data volume is empty).

set -e

echo "🔧 Creating additional databases..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE xenia_dashboard;
    CREATE DATABASE xenia_auth;
    GRANT ALL PRIVILEGES ON DATABASE xenia_dashboard TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE xenia_auth TO $POSTGRES_USER;
EOSQL

echo "✅ Databases xenia_dashboard and xenia_auth created"
