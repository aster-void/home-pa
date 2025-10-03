#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname -- "$0")"
cd ..

# Configuration
MONGO_SERVICE="mongo"
MONGO_HOST="127.0.0.1"
MONGO_PORT="27017"
TIMEOUT_SECONDS=120
POLL_INTERVAL=2

# Function to check if MongoDB is ready
check_mongo_ready() {
  # Try to connect to MongoDB using mongosh ping
  if command -v mongosh >/dev/null 2>&1; then
    mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --eval 'db.adminCommand("ping")' --quiet >/dev/null 2>&1
  else
    # Fallback to netcat if mongosh is not available
    nc -z "$MONGO_HOST" "$MONGO_PORT" >/dev/null 2>&1
  fi
}

# Function to wait for MongoDB readiness with timeout
wait_for_mongo() {
  local start_time=$(date +%s)
  local elapsed=0
  
  echo "Waiting for MongoDB to be ready..."
  
  while [ $elapsed -lt $TIMEOUT_SECONDS ]; do
    if check_mongo_ready; then
      echo "✅ MongoDB is accepting connections!"
      return 0
    fi
    
    echo "MongoDB not ready yet, waiting... (${elapsed}s/${TIMEOUT_SECONDS}s)"
    sleep $POLL_INTERVAL
    elapsed=$(($(date +%s) - start_time))
  done
  
  echo "❌ Timeout waiting for MongoDB to be ready after ${TIMEOUT_SECONDS}s"
  return 1
}

echo "Starting MongoDB with automatic replica set initialization..."
docker compose -f infra/dev.docker-compose.yml up -d

# Wait for MongoDB to be ready before proceeding
if ! wait_for_mongo; then
  echo "❌ MongoDB readiness check failed"
  echo "Check logs with:"
  echo "   docker compose -f infra/dev.docker-compose.yml logs mongo"
  exit 1
fi

echo "Waiting for MongoDB replica set initialization to complete..."

# Wait for the mongo-init service to complete
echo "Monitoring initialization progress..."
docker compose -f infra/dev.docker-compose.yml logs -f mongo-init &
LOG_PID=$!

# Wait for the mongo-init container to exit
while docker compose -f infra/dev.docker-compose.yml ps mongo-init | grep -q "Up"; do
  sleep 2
done

# Stop the log monitoring
kill $LOG_PID 2>/dev/null || true

# Check if initialization was successful
echo "Checking initialization status..."

# Get the exit code from docker compose
INIT_EXIT_CODE=$(docker compose -f infra/dev.docker-compose.yml ps mongo-init --format json | jq -r '.[0].ExitCode // empty')

echo "Initialization container exit code: '${INIT_EXIT_CODE}'"

# Check if the container completed successfully
if [ "$INIT_EXIT_CODE" = "0" ] || [ -z "$INIT_EXIT_CODE" ]; then
  echo "✅ MongoDB is ready with replica set configuration!"
  
  # Verify the replica set is actually working
  echo "Final verification..."
  if ./scripts/verify-replica-set.sh; then
    echo "✅ All systems ready!"
  else
    echo "❌ Replica set verification failed"
    exit 1
  fi
else
  echo "❌ Replica set initialization failed with exit code: $INIT_EXIT_CODE"
  echo "Check logs with:"
  echo "   docker compose -f infra/dev.docker-compose.yml logs mongo-init"
  echo "   docker compose -f infra/dev.docker-compose.yml logs mongo"
  exit 1
fi
