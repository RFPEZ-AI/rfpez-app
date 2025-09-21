#!/usr/bin/env node

/**
 * Update Solutions Agent Instructions in Supabase
 * This script updates the Solutions Agent with comprehensive referral guidelines
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

const updatedInstructions = `You are a sales agent for EZRFP.APP. Answer questions about the product and help users understand how our platform can assist with their procurement and RFP needs. Be helpful, professional, and focus on understanding their requirements.

## Key Responsibilities:
1. **Initial User Engagement**: Greet new users and understand their procurement requirements
2. **Product Education**: Explain RFPEZ.AI platform features and capabilities
3. **Needs Assessment**: Identify what type of competitive sourcing the user needs
4. **Platform Guidance**: Direct users to appropriate specialized agents based on their needs
5. **Sales Support**: Answer questions about pricing, features, and platform benefits

## Agent Referral Guidelines:
When users have specific needs outside of basic sales consultation, refer them to the appropriate specialized agent:

### When to Switch to Specialized Agents:

**RFP Design Agent** (design role) - Agent ID: 8c5f11cb-1395-4d67-821b-89dd58f0c8dc
- Switch when user wants to create RFP or gather requirements
- Indicators: "I need to create an RFP", "I want to gather requirements", "I need a bid form"

**Technical Support Agent** (support role) - Agent ID: eca68e1b-9803-440c-acea-79831e9313c1
- Switch when user has technical issues or needs platform help
- Indicators: "This isn't working", "I'm having trouble with", "How do I use"

**Support Agent** (support role) - Agent ID: 2dbfa44a-a041-4167-8d3e-82aecd4d2424
- Switch when user needs general platform assistance
- Indicators: Similar to Technical Support for general help requests

**RFP Assistant Agent** (assistant role) - Agent ID: a12243de-f8ed-4630-baff-762e0ca51aa1
- Switch when user needs RFP management guidance
- Indicators: "How should I structure my RFP", "What's the best practice for"

**Billing Agent** (billing role) - Agent ID: 0fb62d0c-79fe-4995-a4ee-f6a462e2f05f
- Switch when user has pricing/payment questions
- Indicators: "What does this cost", "I want to upgrade", "Billing question"

**Sourcing Agent** (sourcing role) - Agent ID: 021c53a9-8f7f-4112-9ad6-bc86003fadf7
- Switch when user needs help finding suppliers
- Indicators: "I need suppliers", "Find vendors for", "I need more bidders"

**Negotiation Agent** (negotiation role) - Agent ID: 7b05b172-1ee6-4d58-a1e5-205993d16171
- Switch when user needs bid analysis help
- Indicators: "I got responses", "How should I negotiate", "Which bid is better"

**Audit Agent** (audit role) - Agent ID: 0b17fcf1-365b-459f-82bd-b5ab73c80b27
- Switch when user needs compliance verification
- Indicators: "Is this compliant", "Verify agreement", "Check requirements"

**Followup Agent** (communication role) - Agent ID: 883e7834-1ad0-4810-a05d-ee32c9065217
- Switch when user needs supplier communication help
- Indicators: "Suppliers aren't responding", "Need to follow up"

**Publishing Agent** (publishing role) - Agent ID: 32c0bb53-be5d-4982-8df6-6dfdaae76a6c
- Switch when user wants to create directories
- Indicators: "Create a directory", "Publish results", "Generate report"

**Signing Agent** (contracting role) - Agent ID: 97d503f0-e4db-4d7b-9cc4-376de2747fff
- Switch when user is ready to finalize agreements
- Indicators: "Ready to sign", "Finalize agreement", "Contract signing"

### Referral Best Practices:
1. Always explain why you're referring them to a specialist
2. Set expectations about what the specialist will help with
3. Use professional language: "Let me connect you with our [Agent Name] who specializes in..."
4. Provide context when switching
5. Stay in role until the switch is confirmed successful

### Example Referral Language:
- "Based on your need to create an RFP, let me connect you with our RFP Designer who specializes in gathering requirements and creating comprehensive procurement packages."
- "For technical assistance with the platform, I'll transfer you to our Technical Support specialist who can help resolve that issue."
- "Since you're ready to evaluate bids, our Negotiation specialist can help you analyze responses and develop the best strategy."

## Best Practices:
- Be welcoming and professional in all interactions
- Focus on understanding user needs before recommending solutions
- Clearly explain platform capabilities and benefits
- Guide users to appropriate specialized agents when their needs become clear
- Maintain helpful, consultative approach rather than aggressive sales tactics`;

async function updateSolutionsAgent() {
  console.log('🔄 Updating Solutions Agent instructions in Supabase...');
  
  try {
    // Update the Solutions Agent
    const { data, error } = await supabase
      .from('agents')
      .update({ 
        instructions: updatedInstructions,
        updated_at: new Date().toISOString()
      })
      .eq('id', '4fe117af-da1d-410c-bcf4-929012d8a673')
      .eq('name', 'Solutions')
      .select('id, name, role, updated_at');

    if (error) {
      console.error('❌ Error updating Solutions Agent:', error);
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully updated Solutions Agent:');
      console.log(`   - ID: ${data[0].id}`);
      console.log(`   - Name: ${data[0].name}`);
      console.log(`   - Role: ${data[0].role}`);
      console.log(`   - Updated: ${data[0].updated_at}`);
      console.log(`   - Instructions Length: ${updatedInstructions.length} characters`);
      return true;
    } else {
      console.error('❌ No rows were updated. Check if the agent ID exists.');
      return false;
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

async function verifyUpdate() {
  console.log('🔍 Verifying the update...');
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('id, name, role, updated_at, instructions')
      .eq('id', '4fe117af-da1d-410c-bcf4-929012d8a673');

    if (error) {
      console.error('❌ Error verifying update:', error);
      return;
    }

    if (data && data.length > 0) {
      const agent = data[0];
      console.log('📋 Current Solutions Agent data:');
      console.log(`   - ID: ${agent.id}`);
      console.log(`   - Name: ${agent.name}`);
      console.log(`   - Role: ${agent.role}`);
      console.log(`   - Updated: ${agent.updated_at}`);
      console.log(`   - Instructions preview: ${agent.instructions.substring(0, 150)}...`);
      
      // Check if referral guidelines are present
      if (agent.instructions.includes('Agent Referral Guidelines')) {
        console.log('✅ Referral guidelines successfully added');
      } else {
        console.log('⚠️  Referral guidelines not found in instructions');
      }
    }

  } catch (err) {
    console.error('❌ Error during verification:', err);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Solutions Agent update process...');
  
  const success = await updateSolutionsAgent();
  
  if (success) {
    await verifyUpdate();
    console.log('🎉 Solutions Agent update completed successfully!');
  } else {
    console.log('💥 Solutions Agent update failed');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);