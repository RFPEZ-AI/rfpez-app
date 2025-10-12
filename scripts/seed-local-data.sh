#!/bin/bash
# Seed Local Supabase Database with Test Data
# Copyright Mark Skiba, 2025 All rights reserved

set -e  # Exit on error

echo "🌱 RFPEZ.AI Local Database Seeding"
echo "=================================="
echo ""

# Check if Supabase is running
if ! docker ps | grep -q "supabase_db_rfpez-app-local"; then
  echo "❌ Error: Supabase database container is not running"
  echo "   Please start Supabase first: supabase start"
  exit 1
fi

echo "✅ Supabase database container is running"
echo ""

# Ask for confirmation
read -p "⚠️  This will TRUNCATE existing data. Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Seeding cancelled"
  exit 0
fi

echo ""
echo "📥 Loading seed data into database..."
echo ""

# Run the seed script
cat scripts/seed-test-data.sql | docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

echo ""
echo "✅ Seeding complete!"
echo ""
echo "🎯 Next Steps:"
echo "  1. Open http://localhost:3100 in your browser"
echo "  2. Login with your Supabase auth credentials (creates user profile)"
echo "  3. Create a new session or use existing session"
echo "  4. Set current RFP to 'LED Lighting Procurement'"
echo "  5. Check artifact dropdown - should now show 2 artifacts"
echo "  6. Check browser console logs for the debug output"
echo ""
echo "💡 The artifacts are created, but you need to:"
echo "   - Login first (to create user profile)"
echo "   - Set RFP context (to load artifacts)"
echo ""
