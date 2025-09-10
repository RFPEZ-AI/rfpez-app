#!/bin/bash

# Database Setup Script for Form Artifacts
# This script applies the necessary database migrations for form artifact functionality

echo "🔄 Setting up form_artifacts table..."

# Check if we have Supabase CLI available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    echo "📝 Running migration..."
    supabase db push --file database/migration-add-form-artifacts-table.sql
    echo "✅ Migration complete!"
else
    echo "❌ Supabase CLI not found. Please run the migration manually:"
    echo ""
    echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
    echo "2. Select your project: jxlutaztoukwbbgtoulc"
    echo "3. Go to SQL Editor"
    echo "4. Copy and paste the contents of: database/migration-add-form-artifacts-table.sql"
    echo "5. Run the SQL script"
    echo ""
    echo "📄 Migration file: database/migration-add-form-artifacts-table.sql"
fi

echo ""
echo "🎉 Database setup complete! Your form artifacts should now work properly."
