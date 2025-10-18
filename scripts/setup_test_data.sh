#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

# Read env
SUPABASE_URL=$(grep -E '^REACT_APP_SUPABASE_URL=|^SUPABASE_URL=' .env.local | head -n1 | cut -d= -f2-)
ANON_KEY=$(grep -E '^REACT_APP_SUPABASE_ANON_KEY=' .env.local | head -n1 | cut -d= -f2-)
if [ -z "$ANON_KEY" ] || [ -z "$SUPABASE_URL" ]; then
  echo "Missing SUPABASE_URL or ANON_KEY in .env.local" >&2
  exit 1
fi

# Container detection
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep supabase_db || true)
if [ -z "$DB_CONTAINER" ]; then
  DB_CONTAINER=supabase_db_rfpez-app-local
fi
echo "DB container: $DB_CONTAINER"

TS=$(date +%s)
ADMIN_EMAIL="policy-admin-${TS}@example.com"
MEMBER_EMAIL="policy-member-${TS}@example.com"
OUT_EMAIL="policy-outsider-${TS}@example.com"
PASSWORD='Password123!'

echo "Signing up users via anon key"
signup() {
  local email="$1"
  printf -v payload '%s' '{"email":"%s","password":"%s"}' "$email" "$PASSWORD"
  curl -sS -X POST "$SUPABASE_URL/auth/v1/signup" \
    -H "apikey: $ANON_KEY" -H "Content-Type: application/json" --data "$payload"
}

R1=$(signup "$ADMIN_EMAIL")
R2=$(signup "$MEMBER_EMAIL")
R3=$(signup "$OUT_EMAIL")
echo "signup admin: ${R1:0:200}"
echo "signup member: ${R2:0:200}"
echo "signup out: ${R3:0:200}"

echo "Looking up auth.user ids"
SQL="SELECT id, email FROM auth.users WHERE email IN ('${ADMIN_EMAIL}','${MEMBER_EMAIL}','${OUT_EMAIL}');"
USERS_RAW=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -A -F '|' -c "$SQL")
echo "auth.users rows:\n$USERS_RAW"

ADMIN_ID=$(echo "$USERS_RAW" | awk -F'|' -v e="$ADMIN_EMAIL" '$2==e{print $1}')
MEMBER_ID=$(echo "$USERS_RAW" | awk -F'|' -v e="$MEMBER_EMAIL" '$2==e{print $1}')
OUT_ID=$(echo "$USERS_RAW" | awk -F'|' -v e="$OUT_EMAIL" '$2==e{print $1}')

if [ -z "$ADMIN_ID" ] || [ -z "$MEMBER_ID" ] || [ -z "$OUT_ID" ]; then
  echo "Could not find all created auth users" >&2
  exit 2
fi

echo "Inserting user_profiles via psql (DB superuser)"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('$ADMIN_ID', '$ADMIN_EMAIL', 'policy-admin', 'administrator');"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('$MEMBER_ID', '$MEMBER_EMAIL', 'policy-member', 'user');"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('$OUT_ID', '$OUT_EMAIL', 'policy-outsider', 'user');"

echo "Creating account and agent"
ACCOUNT_ID=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -A -c "INSERT INTO public.accounts (name) VALUES ('policy-test-account') RETURNING id;")
echo "account id: $ACCOUNT_ID"
AGENT_ID=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -A -c "INSERT INTO public.agents (name, description, account_id, created_by) VALUES ('policy-test-agent','policy test', '$ACCOUNT_ID', NULL) RETURNING id;")
echo "agent id: $AGENT_ID"

echo "Find inserted profile ids"
PROF_ADMIN_ID=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -A -c "SELECT id FROM public.user_profiles WHERE email='$ADMIN_EMAIL';" | tr -d '\n')
PROF_MEMBER_ID=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -A -c "SELECT id FROM public.user_profiles WHERE email='$MEMBER_EMAIL';" | tr -d '\n')
echo "profile admin id: $PROF_ADMIN_ID, member id: $PROF_MEMBER_ID"

echo "Linking account_users"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "INSERT INTO public.account_users (account_id, user_id, role) VALUES ('$ACCOUNT_ID', '$PROF_ADMIN_ID', 'admin');"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "INSERT INTO public.account_users (account_id, user_id, role) VALUES ('$ACCOUNT_ID', '$PROF_MEMBER_ID', 'member');"

echo "Running policy test script"
node ./scripts/test_agents_policies.js

echo "setup_test_data.sh completed"
