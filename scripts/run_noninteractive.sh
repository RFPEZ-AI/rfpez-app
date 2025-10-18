#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(dirname "$(dirname "${BASH_SOURCE[0]}")")
cd "$ROOT_DIR"

# Load keys from .env.local
SUPABASE_URL=$(grep -E '^REACT_APP_SUPABASE_URL=|^SUPABASE_URL=' .env.local | head -n1 | cut -d= -f2-)
SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)
if [ -z "$SERVICE_KEY" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY not found in .env.local" >&2
  exit 2
fi

echo "Using SUPABASE_URL=$SUPABASE_URL"
echo "SERVICE_KEY (masked): ${SERVICE_KEY:0:6}...${SERVICE_KEY: -6}"

TS=$(date +%s)
EMAIL="policy-admin-${TS}@example.com"
PASSWORD='Password123!'

# Build JSON safely
DATA=$(printf '%s' '{"email":"%s","password":"%s","email_confirm":true}' "$EMAIL" "$PASSWORD")

echo "Creating admin auth user: $EMAIL"
RESP=$(curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  --data "$DATA")

echo "Create user response (trimmed):"
echo "$RESP" | sed -n '1,200p'
echo "$RESP" > /tmp/sup_resp.json

NEW_USER_ID=$(node -e "const fs=require('fs'); try{const p=JSON.parse(fs.readFileSync('/tmp/sup_resp.json','utf8')); console.log(p.id||'');}catch(e){process.exit(0);} ")
if [ -z "$NEW_USER_ID" ]; then
  echo 'Failed to create auth user; response:'
  cat /tmp/sup_resp.json
  exit 5
fi

echo "New user id: $NEW_USER_ID"

# Find DB container
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep supabase_db || true)
if [ -z "$DB_CONTAINER" ]; then DB_CONTAINER=supabase_db_rfpez-app-local; fi
echo "DB container: $DB_CONTAINER"

echo "Inserting user_profiles row as DB superuser (non-interactive)"
set +e
timeout 30s docker exec -i -e PAGER=cat "$DB_CONTAINER" psql -U postgres -d postgres -c "INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('$NEW_USER_ID', '$EMAIL', 'policy-admin', 'administrator');"
PSQL_EXIT=$?
set -e
if [ $PSQL_EXIT -ne 0 ]; then
  echo "psql exited with $PSQL_EXIT" >&2
  exit 6
fi

echo "Inserted user_profiles row"

echo "Re-running policy test script"
node ./scripts/test_agents_policies.js

echo "Done"
