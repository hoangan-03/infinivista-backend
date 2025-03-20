#!/bin/bash
set -e

# Create databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "infinivista-user";
    CREATE DATABASE "infinivista-feed";
    CREATE DATABASE "infinivista-communication";
EOSQL