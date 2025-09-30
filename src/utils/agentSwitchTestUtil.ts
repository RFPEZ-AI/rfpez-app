// Quick Agent Switch Test Utility
// Copyright Mark Skiba, 2025 All rights reserved

/**
 * Quick utility to test agent switching manually
 * Usage: testAgentSwitch('RFP Designer')
 */

declare global {
  interface Window {
    testAgentSwitch: (agentName: string) => Promise<void>;
    debugLastResponse: () => void;
    showAvailableAgents: () => Promise<any>;
  }
}

// Store last Claude response for debugging
const lastClaudeResponse: any = null;

// Test agent switching functionality  
const testAgentSwitch = async (agentName: string) => {
  console.group(`🧪 Manual Agent Switch Guide for: ${agentName}`);
  
  try {
    // Show available agents first
    await showAvailableAgents();
    
    console.log('\n� Manual Test Steps:');
    console.log('1. In the app, type: "Please switch to the ' + agentName + ' agent"');
    console.log('2. Press Enter to send the message');
    console.log('3. Check console for "MISSED AGENT SWITCH DETECTED" warnings');
    console.log('4. If the switch fails, try: "Execute the switch_agent function for ' + agentName + '"');
    
    console.log('\n🔍 What to look for:');
    console.log('• Agent switch debug messages in console');
    console.log('• UI should show new agent name at top');
    console.log('• New agent should send a greeting message');
    
    console.log('\n💡 Common issues:');
    console.log('• Claude says "switching..." but doesn\'t call function');  
    console.log('• Function called but UI doesn\'t update');
    console.log('• Agent not found or access denied');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  } finally {
    console.groupEnd();
  }
};

// Debug last response
const debugLastResponse = () => {
  if (!lastClaudeResponse) {
    console.log('No response to debug. Run testAgentSwitch() first.');
    return;
  }
  
  console.group('🔍 Last Claude Response Debug');
  console.log('Full response:', lastClaudeResponse);
  console.log('Content length:', lastClaudeResponse.content?.length);
  console.log('Functions called:', lastClaudeResponse.metadata?.functions_called);
  console.log('Function results:', lastClaudeResponse.metadata?.function_results);
  console.groupEnd();
};

// Show available agents
const showAvailableAgents = async () => {
  try {
    const { AgentService } = await import('../services/agentService');
    const agents = await AgentService.getActiveAgents();
    
    console.group('📋 Available Agents');
    agents.forEach(agent => {
      console.log(`• ${agent.name} (${agent.id}) - ${agent.is_free ? 'Free' : agent.is_restricted ? 'Premium' : 'Default'}`);
    });
    console.groupEnd();
    
    return agents;
  } catch (error) {
    console.error('Failed to load agents:', error);
  }
};

// Make functions available globally
if (typeof window !== 'undefined') {
  window.testAgentSwitch = testAgentSwitch;
  window.debugLastResponse = debugLastResponse;
  window.showAvailableAgents = showAvailableAgents;
}

export { testAgentSwitch, debugLastResponse, showAvailableAgents };