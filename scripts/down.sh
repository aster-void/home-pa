#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname -- "$0")"
cd ..

docker compose -f infra/dev.docker-compose.yml down
