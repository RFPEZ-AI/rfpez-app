// Test script to directly test create_and_set_rfp function
// This will help identify performance bottlenecks

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testCreateAndSetRfp() {
  console.log('🧪 Testing create_and_set_rfp function performance...');
  console.log('📊 Environment check:');
  console.log('- Supabase URL:', process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('- Supabase Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  
  const testParams = {
    name: 'Performance Test RFP - ' + new Date().toISOString(),
    description: 'Test RFP for performance analysis',
    specification: 'Basic performance test requirements'
  };
  
  const testUserId = 'test-user-' + Date.now();
  
  try {
    console.log('⏰ Starting test at:', new Date().toISOString());
    const startTime = Date.now();
    
    // Call the edge function directly
    const { data, error } = await supabase.functions.invoke('claude-api-v2', {
      body: {
        functionName: 'create_and_set_rfp',
        parameters: testParams,
        userId: testUserId
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('⏰ Test completed at:', new Date().toISOString());
    console.log('⏱️ Total duration:', duration, 'ms');
    
    if (error) {
      console.error('❌ Function error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Try to get more detailed error info
      try {
        if (error.context && typeof error.context.text === 'function') {
          const errorText = await error.context.text();
          console.error('❌ Error response body:', errorText);
        }
      } catch (e) {
        console.error('❌ Could not read error response body:', e.message);
      }
    } else {
      console.log('✅ Function success!');
      console.log('📊 Result:', JSON.stringify(data, null, 2));
      
      // Performance analysis
      if (duration < 5000) {
        console.log('🚀 Performance: EXCELLENT (< 5s)');
      } else if (duration < 15000) {
        console.log('⚠️ Performance: ACCEPTABLE (5-15s)');
      } else if (duration < 30000) {
        console.log('🐌 Performance: SLOW (15-30s)');
      } else {
        console.log('❌ Performance: TIMEOUT RISK (> 30s)');
      }
    }
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
    console.error('❌ Full error:', err);
  }
}

// Run the test
testCreateAndSetRfp().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(err => {
  console.error('💥 Test failed:', err);
  process.exit(1);
});