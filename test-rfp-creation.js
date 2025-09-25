// Copyright Mark Skiba, 2025 All rights reserved

// Test script to directly trigger RFP creation and monitor the callback flow
console.log('🧪 Testing RFP creation and callback flow...');

// This script should be run in the browser console to test the RFP creation
// It simulates sending a message that should trigger create_and_set_rfp

// Simulate user message to trigger RFP creation
async function testRfpCreation() {
  console.log('🚀 Testing RFP creation trigger...');
  
  // This would normally be called through the UI, but we're testing the trigger
  const testMessage = 'create rfp test';
  
  console.log('📝 Sending message:', testMessage);
  
  // In the browser console, you can access the window object and potentially
  // trigger the message handling directly
  if (typeof window !== 'undefined' && window.postMessage) {
    // Simulate a message event that would trigger RFP creation
    window.postMessage({
      type: 'test_rfp_creation',
      message: testMessage,
      timestamp: new Date().toISOString()
    }, '*');
    
    console.log('✅ Test message posted');
  } else {
    console.log('❌ Window not available - run this in browser console');
  }
}

// Run the test
testRfpCreation();

console.log('🔍 Monitor the network tab for API calls to claude-api-v2');
console.log('🔍 Check console for debug messages from createAndSetRfp function');