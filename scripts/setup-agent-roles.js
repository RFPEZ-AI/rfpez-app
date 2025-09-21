#!/usr/bin/env node

/**
 * Manual Database Setup for Agent Role System
 * This script manually executes the necessary SQL to add the role system
 */

const { createClient } = require('@supabase/supabase-js');
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

async function addRoleColumn() {
  console.log('🔄 Step 1: Adding role column to agents table...');
  
  try {
    // First, let's try to check the current table structure
    const { data: existingAgents, error: checkError } = await supabase
      .from('agents')
      .select('id, name')
      .limit(1);

    if (checkError) {
      console.error('❌ Error accessing agents table:', checkError);
      return false;
    }

    console.log('✅ Agents table is accessible');
    
    // For now, let's try to update agents with role and see if the column exists
    const { data: testUpdate, error: testError } = await supabase
      .from('agents')
      .update({ role: 'sales' })
      .eq('name', 'Solutions')
      .select('id, name, role');

    if (testError && testError.code === '42703') {
      console.log('ℹ️  Role column does not exist, needs to be added via SQL Editor');
      console.log('📋 Please execute this SQL in your Supabase SQL Editor:');
      console.log('');
      console.log('-- Add role column to agents table');
      console.log('ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS role TEXT;');
      console.log('');
      console.log('-- Create index for performance');
      console.log('CREATE INDEX IF NOT EXISTS idx_agents_role ON public.agents(role);');
      console.log('');
      console.log('-- Add comment');
      console.log("COMMENT ON COLUMN public.agents.role IS 'Functional role of the agent';");
      console.log('');
      return false;
    } else if (testError) {
      console.error('❌ Unexpected error:', testError);
      return false;
    } else {
      console.log('✅ Role column already exists!');
      return true;
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

async function populateRoles() {
  console.log('🔄 Step 2: Populating agent roles...');
  
  const agentRoles = {
    'Solutions': 'sales',
    'RFP Design': 'design', 
    'Technical Support': 'support',
    'Support Agent': 'support',
    'RFP Assistant': 'assistant',
    'Audit Agent': 'audit',
    'Billing Agent': 'billing',
    'Followup Agent': 'communication',
    'Negotiation Agent': 'negotiation',
    'Publishing Agent': 'publishing',
    'Signing Agent': 'contracting',
    'Sourcing Agent': 'sourcing'
  };

  try {
    for (const [agentName, role] of Object.entries(agentRoles)) {
      console.log(`   Setting ${agentName} role to: ${role}`);
      
      const { data, error } = await supabase
        .from('agents')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('name', agentName)
        .select('id, name, role');

      if (error) {
        console.error(`   ❌ Error updating ${agentName}:`, error);
        return false;
      }

      if (data && data.length > 0) {
        console.log(`   ✅ Updated ${agentName}: ${data[0].role}`);
      } else {
        console.log(`   ⚠️  Agent ${agentName} not found`);
      }
    }

    console.log('✅ Agent roles populated successfully');
    return true;

  } catch (err) {
    console.error('❌ Error populating roles:', err);
    return false;
  }
}

async function verifySetup() {
  console.log('🔍 Step 3: Verifying setup...');
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('id, name, role, updated_at')
      .order('name');

    if (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }

    console.log('✅ Current agent roles:');
    data.forEach(agent => {
      console.log(`   - ${agent.name}: ${agent.role || 'NULL'}`);
    });

    const missingRoles = data.filter(agent => !agent.role);
    if (missingRoles.length > 0) {
      console.log('⚠️  Agents without roles:');
      missingRoles.forEach(agent => {
        console.log(`   - ${agent.name}`);
      });
    }

    return true;

  } catch (err) {
    console.error('❌ Verification error:', err);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting manual database setup for agent role system...');
  
  const columnExists = await addRoleColumn();
  
  if (!columnExists) {
    console.log('');
    console.log('🛠️  Manual action required:');
    console.log('1. Copy the SQL commands shown above');
    console.log('2. Go to your Supabase project dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and run the SQL commands');
    console.log('5. Then run this script again');
    console.log('');
    process.exit(1);
  }

  const rolesPopulated = await populateRoles();
  
  if (rolesPopulated) {
    await verifySetup();
    console.log('🎉 Database setup completed successfully!');
    console.log('📝 You can now run: node scripts/update-solutions-agent.js');
  } else {
    console.log('💥 Setup failed');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);