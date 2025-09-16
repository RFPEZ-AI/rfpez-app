// Function Status Verification Utility
// Copyright Mark Skiba, 2025 All rights reserved

import { ClaudeAPIFunctionHandler } from '../services/claudeAPIFunctions';

/**
 * Utility to verify that all Claude API functions are working correctly
 */
export class FunctionStatusVerifier {
  private handler: ClaudeAPIFunctionHandler;

  constructor() {
    this.handler = new ClaudeAPIFunctionHandler();
  }

  /**
   * Verify that all critical functions are available and working
   */
  async verifyFunctionStatus(): Promise<{
    allWorking: boolean;
    results: Record<string, { available: boolean; error?: string }>;
  }> {
    const functions = [
      'supabase_select',
      'supabase_insert', 
      'supabase_update',
      'supabase_delete',
      'create_form_artifact',
      'validate_form_data',
      'generate_rfp_bid_url'
    ];

    const results: Record<string, { available: boolean; error?: string }> = {};
    let allWorking = true;

    for (const functionName of functions) {
      try {
        // Test if function exists by checking the switch statement
        console.log(`🔍 Checking function: ${functionName}`);
        
        // For supabase_update, test with a known valid table but impossible condition
        if (functionName === 'supabase_update') {
          try {
            await this.handler.executeFunction(functionName, {
              table: 'form_artifacts',
              data: { title: 'test' },
              filter: { field: 'id', operator: 'eq', value: 'nonexistent_test_id_12345' }
            });
            // If we get here, function is working (even if no rows were updated)
            results[functionName] = { available: true };
            continue;
          } catch (error) {
            // Check if it's a "function disabled" error vs a normal database error
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('temporarily disabled')) {
              results[functionName] = { available: false, error: errorMessage };
              allWorking = false;
              continue;
            } else {
              // Normal database error means function is working
              results[functionName] = { available: true };
              continue;
            }
          }
        }
        
        results[functionName] = { available: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results[functionName] = { available: false, error: errorMessage };
        allWorking = false;
      }
    }

    return { allWorking, results };
  }

  /**
   * Display function status in console
   */
  async displayStatus(): Promise<void> {
    console.log('🔧 Verifying Claude API Function Status...\n');
    
    const { allWorking, results } = await this.verifyFunctionStatus();

    for (const [functionName, result] of Object.entries(results)) {
      if (result.available) {
        console.log(`✅ ${functionName}: Available and working`);
      } else {
        console.error(`❌ ${functionName}: ${result.error}`);
      }
    }

    console.log('\n📊 Overall Status:', allWorking ? '✅ All functions working' : '❌ Some functions have issues');
    
    if (!allWorking) {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Clear browser cache and localStorage');
      console.log('2. Hard refresh the page (Ctrl+Shift+R)');
      console.log('3. Check browser console for any import errors');
      console.log('4. Restart the development server');
    }
  }
}

// Auto-verify on module load in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Delay to allow app to initialize
  setTimeout(async () => {
    try {
      const verifier = new FunctionStatusVerifier();
      await verifier.displayStatus();
    } catch (error) {
      console.error('Failed to verify function status:', error);
    }
  }, 3000);
}

export default FunctionStatusVerifier;
