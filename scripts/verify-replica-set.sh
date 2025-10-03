#!/bin/bash

set -euo pipefail

# Configuration
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
USE_DOCKER="${USE_DOCKER:-false}"

echo "Verifying MongoDB replica set status..."
echo "Host: ${MONGO_HOST}:${MONGO_PORT}"
echo ""

# Determine if we should use Docker or local mongosh
if command -v mongosh >/dev/null 2>&1; then
  MONGO_CMD="mongosh"
  USE_DOCKER=false
elif docker ps | grep -q "home-pa-mongo"; then
  MONGO_CMD="docker exec home-pa-mongo mongosh"
  USE_DOCKER=true
  echo "Using Docker container for MongoDB connection"
else
  echo "❌ ERROR: Neither mongosh nor MongoDB Docker container found"
  echo "Make sure MongoDB is running and either:"
  echo "1. Install mongosh locally, or"
  echo "2. Start MongoDB with: ./scripts/up.sh"
  exit 1
fi

echo ""

# Check if MongoDB is accessible
if ! $MONGO_CMD --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
  echo "❌ ERROR: Cannot connect to MongoDB"
  if [ "$USE_DOCKER" = true ]; then
    echo "Make sure the MongoDB Docker container is running."
  else
    echo "Make sure MongoDB is running and accessible at ${MONGO_HOST}:${MONGO_PORT}"
  fi
  exit 1
fi

echo "✅ MongoDB is accessible"

# Check replica set status
echo ""
echo "Checking replica set status..."

$MONGO_CMD --eval "
try {
  const status = rs.status();
  console.log('✅ Replica set is properly initialized and running');
  console.log('');
  console.log('Replica Set Information:');
  console.log('- Name:', status.set);
  console.log('- Members:', status.members.length);
  console.log('- Primary:', status.members.find(m => m.stateStr === 'PRIMARY')?.name || 'None');
  console.log('- Secondary:', status.members.find(m => m.stateStr === 'SECONDARY')?.name || 'None');
  console.log('');
  console.log('All members:');
  status.members.forEach((member, index) => {
    console.log(\`  \${index + 1}. \${member.name} - \${member.stateStr}\`);
  });
} catch (e) {
  if (e.message.includes('no replset config has been received')) {
    console.log('❌ ERROR: Replica set is not initialized');
    console.log('Run the initialization script: ./scripts/init-replica-set.sh');
    quit(1);
  } else {
    console.log('❌ ERROR: Failed to check replica set status:', e.message);
    quit(1);
  }
}
"

echo ""
echo "✅ Replica set verification complete!"
