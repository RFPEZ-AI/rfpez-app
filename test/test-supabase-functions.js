// Test script to verify the Supabase functions work
const { claudeAPIHandler } = require('../src/services/claudeAPIFunctions.ts');

async function testSupabaseFunctions() {
  console.log('🧪 Testing Supabase Functions...');
  
  try {
    // Test supabase_select
    console.log('\n📋 Testing supabase_select...');
    const selectResult = await claudeAPIHandler.executeFunction('supabase_select', {
      table: 'rfps',
      columns: 'id, title, status',
      limit: 5
    });
    console.log('✅ supabase_select result:', selectResult);
    
    console.log('\n🧪 Supabase functions test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupabaseFunctions();
