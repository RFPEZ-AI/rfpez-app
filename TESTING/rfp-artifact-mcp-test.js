// RFP-Artifact Integration MCP Browser Test
// Execute this script to validate the new RFP-centric functionality
// Date: October 7, 2025

/**
 * PREREQUISITES:
 * 1. React Dev Server running on http://localhost:3100 (VS Code task "Start Development Server")
 * 2. Supabase local stack running (supabase start)
 * 3. Test account: mskiba@esphere.com / thisisatest
 * 4. At least 2 RFPs in the database for testing
 */

const runRFPArtifactTest = async () => {
  console.log('🚀 Starting RFP-Artifact Integration Test');
  
  try {
    // =====================================================
    // PHASE 1: ENVIRONMENT SETUP AND AUTHENTICATION
    // =====================================================
    
    console.log('📋 Phase 1: Setup and Authentication');
    
    // Activate required MCP browser tools
    await activate_mcp_browser_navigation_tools();
    await activate_mcp_browser_interaction_tools();
    await activate_mcp_browser_visual_tools();
    await activate_mcp_browser_script_tools();
    
    // Navigate to application
    console.log('🌐 Navigating to http://localhost:3100');
    await mcp_browser_navigate({ url: 'http://localhost:3100' });
    await mcp_browser_screenshot({ name: 'test-01-homepage-initial' });
    
    // Check if already logged in
    const initialElements = await mcp_browser_get_clickable_elements();
    const hasLoginButton = initialElements.some(el => el.text?.includes('Login'));
    
    if (hasLoginButton) {
      console.log('🔐 Logging in...');
      // Login sequence
      await mcp_browser_click({ index: 2 }); // Login button
      await mcp_browser_form_input_fill({ index: 3, value: 'mskiba@esphere.com' });
      await mcp_browser_form_input_fill({ index: 5, value: 'thisisatest' });
      await mcp_browser_click({ index: 6 }); // Sign In
      
      // Wait for login to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      await mcp_browser_screenshot({ name: 'test-02-logged-in' });
    } else {
      console.log('✅ Already logged in');
    }
    
    // =====================================================
    // PHASE 2: RFP DROPDOWN FUNCTIONALITY TEST
    // =====================================================
    
    console.log('📋 Phase 2: RFP Dropdown Functionality');
    
    // Take screenshot of initial footer state
    await mcp_browser_screenshot({ name: 'test-03-footer-initial-state' });
    
    // Look for RFP dropdown in footer
    const footerElements = await mcp_browser_get_clickable_elements();
    console.log('🔍 Searching for RFP dropdown...');
    
    // Try to find RFP dropdown (look for IonSelect or dropdown)
    const rfpDropdownIndex = footerElements.findIndex(el => 
      el.text?.includes('Current RFP') || 
      el.text?.includes('Select RFP') ||
      el.role?.includes('combobox') ||
      el.tag === 'ion-select'
    );
    
    if (rfpDropdownIndex !== -1) {
      console.log('✅ Found RFP dropdown at index:', rfpDropdownIndex);
      
      // Click RFP dropdown to open it
      await mcp_browser_click({ index: rfpDropdownIndex });
      await mcp_browser_screenshot({ name: 'test-04-rfp-dropdown-open' });
      
      // Wait for dropdown options to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get updated elements to see dropdown options
      const dropdownElements = await mcp_browser_get_clickable_elements();
      const rfpOptions = dropdownElements.filter(el => 
        el.text && el.text.trim().length > 0 && !el.text.includes('Current RFP')
      );
      
      console.log('📝 Available RFP options:', rfpOptions.length);
      
      if (rfpOptions.length > 0) {
        // Select first RFP option
        console.log('🎯 Selecting first RFP option...');
        await mcp_browser_click({ index: rfpOptions[0].index });
        await mcp_browser_screenshot({ name: 'test-05-first-rfp-selected' });
        
        // Wait for context to update
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('⚠️ No RFP options found - may need to create RFPs first');
      }
    } else {
      console.log('❌ RFP dropdown not found - checking page structure...');
      await mcp_browser_screenshot({ name: 'test-04-dropdown-not-found' });
      
      // Print all clickable elements for debugging
      console.log('Available elements:', footerElements.map(el => ({
        index: el.index,
        text: el.text,
        tag: el.tag,
        role: el.role
      })));
    }
    
    // =====================================================
    // PHASE 3: SESSION CREATION WITH RFP CONTEXT
    // =====================================================
    
    console.log('📋 Phase 3: Session Creation with RFP Context');
    
    // Create new session
    console.log('➕ Creating new session...');
    
    // Look for new session button
    const newSessionElements = await mcp_browser_get_clickable_elements();
    const newSessionIndex = newSessionElements.findIndex(el => 
      el.text?.includes('New Session') || 
      el.text?.includes('New Chat') ||
      el.text?.includes('+')
    );
    
    if (newSessionIndex !== -1) {
      await mcp_browser_click({ index: newSessionIndex });
      await mcp_browser_screenshot({ name: 'test-06-new-session-created' });
    } else {
      console.log('⚠️ New session button not found, using current session');
    }
    
    // Send a message to create artifacts
    console.log('💬 Sending message to create RFP artifacts...');
    
    const messageElements = await mcp_browser_get_clickable_elements();
    const textareaIndex = messageElements.findIndex(el => el.tag === 'textarea');
    
    if (textareaIndex !== -1) {
      await mcp_browser_click({ index: textareaIndex });
      await mcp_browser_form_input_fill({ 
        index: textareaIndex, 
        value: 'Create a comprehensive supplier evaluation form for LED lighting procurement including technical specifications, pricing, and delivery requirements' 
      });
      await mcp_browser_press_key({ key: 'Enter' });
      await mcp_browser_screenshot({ name: 'test-07-message-sent' });
      
      // Wait for Claude response and artifacts
      console.log('⏳ Waiting for Claude response and artifact creation...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await mcp_browser_screenshot({ name: 'test-08-artifacts-created' });
    } else {
      console.log('❌ Message input not found');
    }
    
    // =====================================================
    // PHASE 4: ARTIFACT WINDOW VERIFICATION
    // =====================================================
    
    console.log('📋 Phase 4: Artifact Window Verification');
    
    // Open artifact window
    const artifactElements = await mcp_browser_get_clickable_elements();
    const artifactToggleIndex = artifactElements.findIndex(el => 
      el.text?.includes('Artifacts') || 
      el.text?.includes('Forms') ||
      el.role?.includes('button')
    );
    
    if (artifactToggleIndex !== -1) {
      console.log('🎯 Opening artifact window...');
      await mcp_browser_click({ index: artifactToggleIndex });
      await mcp_browser_screenshot({ name: 'test-09-artifact-window-open' });
      
      // Wait for artifacts to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot of loaded artifacts
      await mcp_browser_screenshot({ name: 'test-10-artifacts-loaded' });
      
      // Count visible artifacts
      const currentArtifactElements = await mcp_browser_get_clickable_elements();
      const artifactItems = currentArtifactElements.filter(el => 
        el.text && (el.text.includes('form') || el.text.includes('Form'))
      );
      
      console.log('📊 Artifacts displayed:', artifactItems.length);
    } else {
      console.log('⚠️ Artifact toggle not found');
    }
    
    // =====================================================
    // PHASE 5: RFP CONTEXT SWITCHING TEST
    // =====================================================
    
    console.log('📋 Phase 5: RFP Context Switching');
    
    // Try to switch to different RFP
    console.log('🔄 Testing RFP context switching...');
    
    // Find RFP dropdown again
    const switchElements = await mcp_browser_get_clickable_elements();
    const switchDropdownIndex = switchElements.findIndex(el => 
      el.text?.includes('Current RFP') || el.tag === 'ion-select'
    );
    
    if (switchDropdownIndex !== -1) {
      await mcp_browser_click({ index: switchDropdownIndex });
      await mcp_browser_screenshot({ name: 'test-11-switching-rfp-dropdown' });
      
      // Wait and try to select different RFP
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const switchOptions = await mcp_browser_get_clickable_elements();
      const secondRFPOption = switchOptions.filter(el => 
        el.text && el.text.trim().length > 0 && !el.text.includes('Current RFP')
      )[1]; // Second option
      
      if (secondRFPOption) {
        await mcp_browser_click({ index: secondRFPOption.index });
        await mcp_browser_screenshot({ name: 'test-12-second-rfp-selected' });
        
        // Wait for context switch
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if artifacts changed
        await mcp_browser_screenshot({ name: 'test-13-artifacts-after-rfp-switch' });
      }
    }
    
    // =====================================================
    // PHASE 6: SESSION HISTORY AND CONTEXT VERIFICATION
    // =====================================================
    
    console.log('📋 Phase 6: Session History Verification');
    
    // Take screenshot of session list to check naming
    await mcp_browser_screenshot({ name: 'test-14-session-history' });
    
    // Get page text to examine session names
    const pageText = await mcp_browser_get_text();
    console.log('📄 Checking for RFP context in session names...');
    
    // Look for RFP-related text in session names
    const hasRFPContext = pageText.includes('LED') || 
                          pageText.includes('RFP') || 
                          pageText.includes('procurement');
    
    console.log('🏷️ Session names contain RFP context:', hasRFPContext);
    
    // =====================================================
    // PHASE 7: FINAL VALIDATION
    // =====================================================
    
    console.log('📋 Phase 7: Final Validation');
    
    // Take comprehensive final screenshots
    await mcp_browser_screenshot({ name: 'test-15-final-state-overview' });
    
    // Scroll to see full interface
    await mcp_browser_scroll({ direction: 'up' });
    await mcp_browser_screenshot({ name: 'test-16-final-state-top' });
    
    await mcp_browser_scroll({ direction: 'down' });
    await mcp_browser_screenshot({ name: 'test-17-final-state-bottom' });
    
    console.log('✅ RFP-Artifact Integration Test Completed Successfully!');
    
    // =====================================================
    // TEST RESULTS SUMMARY
    // =====================================================
    
    const testResults = {
      timestamp: new Date().toISOString(),
      phases: {
        'Setup & Authentication': '✅ Completed',
        'RFP Dropdown Functionality': rfpDropdownIndex !== -1 ? '✅ Found' : '❌ Not Found',
        'Session Creation': textareaIndex !== -1 ? '✅ Completed' : '❌ Failed',
        'Artifact Window': artifactToggleIndex !== -1 ? '✅ Opened' : '❌ Not Found',
        'RFP Context Switching': switchDropdownIndex !== -1 ? '✅ Tested' : '❌ Not Available',
        'Session History': hasRFPContext ? '✅ RFP Context Found' : '⚠️ Context Unclear'
      },
      screenshots: 17,
      criticalIssues: [],
      recommendations: []
    };
    
    // Add issues found
    if (rfpDropdownIndex === -1) {
      testResults.criticalIssues.push('RFP dropdown not found in footer');
      testResults.recommendations.push('Verify HomeFooter.tsx dropdown implementation');
    }
    
    if (textareaIndex === -1) {
      testResults.criticalIssues.push('Message input not accessible');
      testResults.recommendations.push('Check message input accessibility');
    }
    
    console.log('📊 TEST RESULTS SUMMARY:');
    console.log(JSON.stringify(testResults, null, 2));
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    await mcp_browser_screenshot({ name: 'test-error-state' });
    throw error;
  }
};

// Export for standalone execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runRFPArtifactTest };
}

// Auto-execute if running directly
if (typeof window !== 'undefined') {
  console.log('🎯 RFP-Artifact Integration Test Ready');
  console.log('💡 Execute: runRFPArtifactTest()');
}