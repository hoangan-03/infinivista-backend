#!/bin/bash
set -e

# Create databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS "infinivista-user";
    CREATE DATABASE IF NOT EXISTS "infinivista-feed";
    CREATE DATABASE IF NOT EXISTS "infinivista-communication";
EOSQL