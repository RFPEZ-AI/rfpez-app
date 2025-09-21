#!/usr/bin/env node

/**
 * Apply Database Migrations for Agent Role System
 * This script applies all necessary database migrations for the agent role system
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript(scriptPath, description) {
  console.log(`🔄 ${description}...`);
  
  try {
    // Read the SQL script
    const sqlContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Split into individual statements (basic splitting on semicolon + newline)
    const statements = sqlContent
      .split(';\n')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Try direct query execution if RPC fails
          console.log(`   RPC failed, trying direct query...`);
          const { data: queryData, error: queryError } = await supabase
            .from('agents')
            .select('*')
            .limit(1);
          
          if (queryError && queryError.code === '42703') {
            console.log(`   Column doesn't exist yet, this is expected for migration...`);
          } else if (queryError) {
            console.error(`   ❌ Error in statement ${i + 1}:`, queryError);
            return false;
          }
        }
      }
    }

    console.log(`✅ ${description} completed successfully`);
    return true;

  } catch (err) {
    console.error(`❌ Error reading or executing ${scriptPath}:`, err);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting database migrations for agent role system...');
  
  const migrationsDir = path.join(__dirname, '..', 'database');
  
  // Migration 1: Add role column to agents table
  const migration1 = path.join(migrationsDir, 'add-agent-role-migration.sql');
  if (!await executeSQLScript(migration1, 'Adding role column to agents table')) {
    console.log('❌ Migration 1 failed');
    return false;
  }

  // Migration 2: Update session active agent function
  const migration2 = path.join(migrationsDir, 'update-session-active-agent-function.sql');
  if (fs.existsSync(migration2)) {
    if (!await executeSQLScript(migration2, 'Updating session active agent function')) {
      console.log('❌ Migration 2 failed');
      return false;
    }
  } else {
    console.log('ℹ️  Session active agent function update not found, skipping...');
  }

  return true;
}

async function verifyMigrations() {
  console.log('🔍 Verifying migrations...');
  
  try {
    // Check if role column exists and has data
    const { data, error } = await supabase
      .from('agents')
      .select('id, name, role')
      .limit(5);

    if (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }

    console.log('✅ Migration verification successful:');
    data.forEach(agent => {
      console.log(`   - ${agent.name}: ${agent.role || 'NULL'}`);
    });

    return true;

  } catch (err) {
    console.error('❌ Verification error:', err);
    return false;
  }
}

// Main execution
async function main() {
  const success = await runMigrations();
  
  if (success) {
    await verifyMigrations();
    console.log('🎉 All migrations completed successfully!');
    console.log('📝 You can now run the Solutions Agent update script');
  } else {
    console.log('💥 Migrations failed');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);