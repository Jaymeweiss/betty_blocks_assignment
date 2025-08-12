#!/bin/bash
set -e

echo "Starting DataApi..."

# Wait for postgres to be ready by attempting to connect
echo "Waiting for database to be ready..."
until mix run -e "DataApi.Release.migrate()" 2>/dev/null; do
  echo "Database not ready, waiting 2 seconds..."
  sleep 2
done

echo "Database is ready and migrations completed!"

# Start the Phoenix server
exec "$@"