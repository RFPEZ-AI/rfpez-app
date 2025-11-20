#!/usr/bin/env node

/**
 * Test script for suffix-based artifact roles
 * Tests that multiple analysis/report documents can be created with suffixed roles
 */

const LOCAL_EDGE_FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/claude-api-v3';

// Test scenarios
const tests = [
  {
    name: 'Test 1: Create base analysis_document',
    toolName: 'create_document_artifact',
    input: {
      name: 'Vendor Comparison Analysis',
      description: 'Comparative analysis of vendors',
      content: 'This is a vendor comparison analysis...',
      content_type: 'markdown',
      artifactRole: 'analysis_document'
    }
  },
  {
    name: 'Test 2: Create suffixed analysis_document_cost_benefit',
    toolName: 'create_document_artifact',
    input: {
      name: 'Cost-Benefit Analysis',
      description: 'Financial cost-benefit analysis',
      content: 'This is a cost-benefit analysis...',
      content_type: 'markdown',
      artifactRole: 'analysis_document_cost_benefit'
    }
  },
  {
    name: 'Test 3: Create suffixed analysis_document_technical',
    toolName: 'create_document_artifact',
    input: {
      name: 'Technical Analysis',
      description: 'Technical feasibility analysis',
      content: 'This is a technical analysis...',
      content_type: 'markdown',
      artifactRole: 'analysis_document_technical'
    }
  },
  {
    name: 'Test 4: Update existing analysis_document (exact match)',
    toolName: 'create_document_artifact',
    input: {
      name: 'Vendor Comparison Analysis (Updated)',
      description: 'Updated comparative analysis',
      content: 'This is the UPDATED vendor comparison...',
      content_type: 'markdown',
      artifactRole: 'analysis_document'
    }
  },
  {
    name: 'Test 5: Invalid suffix (should fail validation)',
    toolName: 'create_document_artifact',
    input: {
      name: 'Invalid Document',
      description: 'Invalid role',
      content: 'Test invalid role',
      content_type: 'markdown',
      artifactRole: 'invalid_document_test'
    }
  }
];

async function runTest(test, sessionId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${test.name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const response = await fetch(LOCAL_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Test calling ${test.toolName}`
        }],
        session_id: sessionId,
        tool_name: test.toolName,
        tool_input: test.input
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ HTTP Error:', response.status, response.statusText);
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    console.log('✅ Response received');
    console.log('Result:', JSON.stringify(data, null, 2));
    return { success: true, data };
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Testing Suffix-Based Artifact Roles');
  console.log('Edge Function URL:', LOCAL_EDGE_FUNCTION_URL);
  
  // Use a test session ID (you'll need to create this in your database)
  const sessionId = process.argv[2];
  
  if (!sessionId) {
    console.log('\n❌ Error: Session ID required');
    console.log('Usage: node test-suffix-roles.js <session-id>');
    console.log('\nCreate a test session first:');
    console.log('docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres');
    console.log("INSERT INTO sessions (title) VALUES ('Test Session') RETURNING id;");
    process.exit(1);
  }

  console.log('Session ID:', sessionId);
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test, sessionId);
    results.push({ test: test.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach((result, i) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${i + 1}. ${status} - ${result.test}`);
  });
  
  const passCount = results.filter(r => r.success).length;
  console.log(`\nTotal: ${passCount}/${results.length} passed`);
}

main().catch(console.error);
