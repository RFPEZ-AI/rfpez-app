#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/supabase-kong-fix.sh [container-name] [path-to-kong-yml] [timeout-seconds]
# Defaults: container-name=supabase_kong_rfpez-app-local, path=./temp/kong.yml.fixed, timeout=60

CONTAINER=${1:-supabase_kong_rfpez-app-local}
SRC=${2:-./temp/kong.yml.fixed}
TIMEOUT=${3:-60}

if [ ! -f "$SRC" ]; then
  echo "Error: source file '$SRC' not found" >&2
  exit 2
fi

echo "Waiting up to ${TIMEOUT}s for container '$CONTAINER' to exist..."
start=$(date +%s)
while true; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    break
  fi
  now=$(date +%s)
  if [ $((now - start)) -ge $TIMEOUT ]; then
    echo "Timeout: container '$CONTAINER' not found after ${TIMEOUT}s" >&2
    exit 3
  fi
  sleep 1
done

echo "Copying '$SRC' -> $CONTAINER:/home/kong/kong.yml"
docker cp "$SRC" "$CONTAINER":/home/kong/kong.yml

echo "Setting ownership to kong:root (may require root inside container)"
if docker exec -u 0 "$CONTAINER" true 2>/dev/null; then
  docker exec -u 0 "$CONTAINER" chown kong:root /home/kong/kong.yml || true
else
  echo "Note: unable to exec as root in container; attempting normal chown inside container"
  docker exec "$CONTAINER" chown kong:root /home/kong/kong.yml || true
fi

echo "Restarting container $CONTAINER"
docker restart "$CONTAINER"

echo "Waiting 3s for container to come up..."
sleep 3

echo "Tail last 200 lines of logs for $CONTAINER:"
docker logs --tail 200 "$CONTAINER" || true

# Optional: Try to query Kong Admin API from host (assuming port mapping exists)
if docker port "$CONTAINER" 8001 >/dev/null 2>&1; then
  ADMIN_PORT=$(docker port "$CONTAINER" 8001 | sed -n '1p' | sed 's/.*://')
  echo "Attempting to query Kong Admin API at localhost:${ADMIN_PORT}"
  if command -v curl >/dev/null 2>&1; then
    curl -sS "http://127.0.0.1:${ADMIN_PORT}/services/rest-v1/plugins" || true
  else
    echo "curl not installed locally; skipping Admin API check"
  fi
else
  echo "No host mapping for port 8001 found; skip Admin API check"
fi

echo "Done. If Kong still fails to start, run 'docker logs -f $CONTAINER' and examine errors."
