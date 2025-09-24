// Copyright Mark Skiba, 2025 All rights reserved
// Browser Console Test for Phase 1

// Simple test function to run in browser console
window.testPhase1Quick = async function() {
  console.log('🧪 Quick Phase 1 Test Starting...');
  
  try {
    // Import the claudeAPIProxy
    const { claudeAPIProxy } = await import('./services/claudeAPIProxy');
    
    // Test connection
    console.log('📡 Testing connection...');
    const result = await claudeAPIProxy.testConnection();
    console.log('✅ Connection test result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return { success: false, error: error.message };
  }
};

console.log('🔧 Quick test loaded. Run window.testPhase1Quick() to test edge function connection.');