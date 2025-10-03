#!/bin/bash

set -euo pipefail

# Trap to handle script interruption
trap 'echo "Script interrupted by user. Exiting..."; exit 130' INT TERM

# Configuration
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
REPLICA_SET_NAME="${REPLICA_SET_NAME:-rs0}"
MAX_RETRIES=30
RETRY_INTERVAL=2
TIMEOUT_SECONDS=300  # 5 minutes total timeout
RS_INIT_MAX_RETRIES=30
RS_INIT_RETRY_INTERVAL=1

echo "Starting MongoDB replica set initialization..."

# Function to check if MongoDB is accepting connections
wait_for_mongo() {
  local host=$1
  local port=$2
  local retries=0
  local start_time=$(date +%s)
  
  echo "Waiting for MongoDB to be ready on ${host}:${port}..."
  echo "Timeout: ${TIMEOUT_SECONDS} seconds, Max retries: ${MAX_RETRIES}"
  
  while [ $retries -lt $MAX_RETRIES ]; do
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    
    # Check if we've exceeded the global timeout
    if [ $elapsed -ge $TIMEOUT_SECONDS ]; then
      echo "ERROR: Timeout reached (${TIMEOUT_SECONDS}s). MongoDB failed to become ready."
      return 1
    fi
    
    if mongosh --host "${host}:${port}" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
      echo "MongoDB is ready! (took ${elapsed} seconds)"
      return 0
    fi
    
    echo "MongoDB is not ready yet. Waiting... (attempt $((retries + 1))/$MAX_RETRIES, elapsed: ${elapsed}s)"
    sleep $RETRY_INTERVAL
    retries=$((retries + 1))
  done
  
  echo "ERROR: MongoDB failed to become ready after $MAX_RETRIES attempts (${elapsed} seconds elapsed)"
  return 1
}

# Function to check if replica set is already initialized
check_replica_set_status() {
  local host=$1
  local port=$2
  
  echo "Checking replica set status..."
  
  if mongosh --host "${host}:${port}" --eval "
    try {
      const status = rs.status();
      if (status.ok === 1) {
        print('Replica set is already initialized and running');
        quit(0);
      } else {
        print('Replica set exists but not properly configured');
        quit(1);
      }
    } catch (e) {
      if (e.message.includes('no replset config has been received')) {
        print('Replica set not initialized yet');
        quit(1);
      } else {
        print('Error checking replica set status: ' + e.message);
        quit(2);
      }
    }
  " > /dev/null 2>&1; then
    return 0  # Already initialized
  else
    return 1  # Not initialized
  fi
}

# Function to initialize replica set
init_replica_set() {
  local host=$1
  local port=$2
  
  echo "Initializing replica set '${REPLICA_SET_NAME}'..."
  
  # Determine the host for replica set member
  # If running in Docker, use the container name, otherwise use localhost
  local member_host
  if [ "${host}" = "localhost" ] || [ "${host}" = "127.0.0.1" ]; then
    member_host="localhost:${port}"
  else
    member_host="${host}:${port}"
  fi
  
  mongosh --host "${host}:${port}" --eval "
    try {
      const result = rs.initiate({
        _id: '${REPLICA_SET_NAME}',
        members: [
          { _id: 0, host: '${member_host}' }
        ]
      });
      print('Replica set initialization command sent successfully');
      
      // Wait for replica set to be ready with timeout
      var retries = ${RS_INIT_MAX_RETRIES};
      var startTime = new Date().getTime();
      var timeoutMs = ${TIMEOUT_SECONDS} * 1000; // Convert to milliseconds
      
      while (retries > 0) {
        var currentTime = new Date().getTime();
        var elapsed = currentTime - startTime;
        
        // Check timeout
        if (elapsed >= timeoutMs) {
          print('ERROR: Timeout reached (' + ${TIMEOUT_SECONDS} + 's). Replica set initialization may not be complete.');
          quit(1);
        }
        
        try {
          const status = rs.status();
          if (status.ok === 1) {
            print('Replica set is now ready and accepting connections (took ' + Math.round(elapsed/1000) + ' seconds)');
            break;
          }
        } catch (e) {
          // Still initializing
        }
        print('Waiting for replica set to be ready... (' + retries + ' attempts remaining, elapsed: ' + Math.round(elapsed/1000) + 's)');
        sleep(${RS_INIT_RETRY_INTERVAL} * 1000); // Convert to milliseconds
        retries--;
      }
      
      if (retries === 0) {
        print('ERROR: Replica set initialization failed after ' + ${RS_INIT_MAX_RETRIES} + ' attempts');
        quit(1);
      }
      
    } catch (e) {
      if (e.message.includes('already initialized')) {
        print('Replica set already initialized');
      } else {
        print('ERROR: Failed to initialize replica set: ' + e.message);
        quit(1);
      }
    }
  "
}

# Main execution
main() {
  local start_time=$(date +%s)
  
  echo "MongoDB Replica Set Initialization Script"
  echo "=========================================="
  echo "Host: ${MONGO_HOST}"
  echo "Port: ${MONGO_PORT}"
  echo "Replica Set: ${REPLICA_SET_NAME}"
  echo "Timeout: ${TIMEOUT_SECONDS} seconds"
  echo ""
  
  # Wait for MongoDB to be ready
  if ! wait_for_mongo "${MONGO_HOST}" "${MONGO_PORT}"; then
    echo "ERROR: Failed to connect to MongoDB within timeout period"
    exit 1
  fi
  
  # Check if replica set is already initialized
  if check_replica_set_status "${MONGO_HOST}" "${MONGO_PORT}"; then
    echo "Replica set is already initialized and running. Nothing to do."
    exit 0
  fi
  
  # Initialize replica set
  if ! init_replica_set "${MONGO_HOST}" "${MONGO_PORT}"; then
    echo "ERROR: Failed to initialize replica set"
    exit 1
  fi
  
  local end_time=$(date +%s)
  local total_time=$((end_time - start_time))
  
  echo ""
  echo "✅ Replica set initialization complete!"
  echo "MongoDB is ready for use with replica set '${REPLICA_SET_NAME}'"
  echo "Total execution time: ${total_time} seconds"
}

# Run main function
main "$@"
