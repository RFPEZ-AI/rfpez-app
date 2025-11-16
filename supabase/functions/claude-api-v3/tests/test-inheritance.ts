// Test Agent Inheritance System End-to-End
// Tests the complete inheritance chain: _common → RFP Design → TMC Specialist

import { loadAgentWithInheritance, logInheritanceDetails } from '../utils/agent-inheritance.ts';

// Mock Supabase client for testing
const createMockSupabase = () => {
  const agents = new Map([
    ['9bcfab80-08e5-424f-8ab9-86b91c3bae00', { // _common
      id: '9bcfab80-08e5-424f-8ab9-86b91c3bae00',
      name: '_common',
      role: 'base',
      instructions: '### COMMON INSTRUCTIONS\nMemory system, agent switching, Perplexity search...',
      initial_prompt: '',
      access: ['create_memory', 'search_memories', 'get_conversation_history', 'store_message', 'search_messages', 'get_current_agent', 'get_available_agents', 'switch_agent', 'recommend_agent', 'perplexity_search', 'perplexity_ask'],
      parent_agent_id: null,
      is_abstract: true,
      inheritance_depth: 0
    }],
    ['8c5f11cb-1395-4d67-821b-89dd58f0c8dc', { // RFP Design
      id: '8c5f11cb-1395-4d67-821b-89dd58f0c8dc',
      name: 'RFP Design',
      role: 'design',
      instructions: '### RFP DESIGN INSTRUCTIONS\nCreate RFPs, forms, artifacts...',
      initial_prompt: 'Welcome! I help create comprehensive RFPs.',
      access: ['create_and_set_rfp', 'create_form_artifact', 'perplexity_research'],
      parent_agent_id: '9bcfab80-08e5-424f-8ab9-86b91c3bae00',
      is_abstract: false,
      inheritance_depth: 1
    }],
    ['d6e83135-2b2d-47b7-91a0-5a3e138e7eb0', { // TMC Specialist
      id: 'd6e83135-2b2d-47b7-91a0-5a3e138e7eb0',
      name: 'TMC Specialist',
      role: 'design',
      instructions: '### TMC SPECIALIST INSTRUCTIONS\nTechnology Maintenance Contracts...',
      initial_prompt: 'I specialize in Technology Maintenance Contracts.',
      access: [], // No additional tools
      parent_agent_id: '8c5f11cb-1395-4d67-821b-89dd58f0c8dc',
      is_abstract: false,
      inheritance_depth: 2
    }]
  ]);

  return {
    from: () => ({
      select: () => ({
        eq: (field: string, value: string) => ({
          maybeSingle: async () => {
            const agent = agents.get(value);
            return { data: agent || null, error: null };
          }
        })
      })
    })
  };
};

async function runTests() {
  console.log('🧪 Testing Agent Inheritance System\n');
  console.log('=' .repeat(60));
  
  const supabase = createMockSupabase();
  
  // Test 1: Load _common (root, no inheritance)
  console.log('\n📋 Test 1: Load _common agent (root)');
  console.log('-'.repeat(60));
  const common = await loadAgentWithInheritance(supabase, '9bcfab80-08e5-424f-8ab9-86b91c3bae00');
  if (common) {
    console.log(`✅ Loaded: ${common.name}`);
    console.log(`   Instructions length: ${common.instructions.length}`);
    console.log(`   Tool count: ${common.access?.length || 0}`);
    console.log(`   Inheritance chain: ${common._inheritanceChain?.join(' → ') || 'N/A'}`);
  }
  
  // Test 2: Load RFP Design (2-level: _common → RFP Design)
  console.log('\n📋 Test 2: Load RFP Design agent (2-level inheritance)');
  console.log('-'.repeat(60));
  const rfpDesign = await loadAgentWithInheritance(supabase, '8c5f11cb-1395-4d67-821b-89dd58f0c8dc');
  if (rfpDesign) {
    console.log(`✅ Loaded: ${rfpDesign.name}`);
    console.log(`   Instructions length: ${rfpDesign.instructions.length}`);
    console.log(`   Tool count: ${rfpDesign.access?.length || 0}`);
    console.log(`   Inheritance chain: ${rfpDesign._inheritanceChain?.join(' → ') || 'N/A'}`);
    console.log(`   Expected tools: _common (11) + RFP Design (3) = ~14 (de-duped)`);
  }
  
  // Test 3: Load TMC Specialist (3-level: _common → RFP Design → TMC)
  console.log('\n📋 Test 3: Load TMC Specialist agent (3-level inheritance)');
  console.log('-'.repeat(60));
  const tmcSpecialist = await loadAgentWithInheritance(supabase, 'd6e83135-2b2d-47b7-91a0-5a3e138e7eb0');
  if (tmcSpecialist) {
    console.log(`✅ Loaded: ${tmcSpecialist.name}`);
    console.log(`   Instructions length: ${tmcSpecialist.instructions.length}`);
    console.log(`   Tool count: ${tmcSpecialist.access?.length || 0}`);
    console.log(`   Inheritance chain: ${tmcSpecialist._inheritanceChain?.join(' → ') || 'N/A'}`);
    console.log(`   Expected: _common instructions + RFP Design instructions + TMC instructions`);
    
    // Log detailed inheritance info
    console.log('\n📊 Detailed Inheritance Analysis:');
    logInheritanceDetails(tmcSpecialist);
  }
  
  // Test 4: Verify cache works
  console.log('\n📋 Test 4: Verify caching (load TMC Specialist again)');
  console.log('-'.repeat(60));
  const tmcCached = await loadAgentWithInheritance(supabase, 'd6e83135-2b2d-47b7-91a0-5a3e138e7eb0');
  if (tmcCached) {
    console.log(`✅ Cache hit: ${tmcCached.name}`);
    console.log(`   Same instance: ${tmcCached === tmcSpecialist}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('=' .repeat(60));
  
  // Verification
  const checks = [
    { name: '_common has no parent', pass: common?._inheritanceChain?.length === 1 },
    { name: 'RFP Design has 2-level chain', pass: rfpDesign?._inheritanceChain?.length === 2 },
    { name: 'TMC Specialist has 3-level chain', pass: tmcSpecialist?._inheritanceChain?.length === 3 },
    { name: 'TMC includes _common tools', pass: (tmcSpecialist?.access?.includes('create_memory') || false) },
    { name: 'TMC includes RFP Design tools', pass: (tmcSpecialist?.access?.includes('create_and_set_rfp') || false) },
    { name: 'Instructions are merged', pass: (tmcSpecialist?.instructions.includes('COMMON') && tmcSpecialist?.instructions.includes('RFP DESIGN') && tmcSpecialist?.instructions.includes('TMC')) }
  ];
  
  console.log('\n📊 Verification Results:');
  checks.forEach(check => {
    console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.pass);
  if (allPassed) {
    console.log('\n🎉 All verification checks passed!');
  } else {
    console.log('\n⚠️  Some checks failed - review output above');
  }
}

// Run tests
runTests().catch(console.error);
