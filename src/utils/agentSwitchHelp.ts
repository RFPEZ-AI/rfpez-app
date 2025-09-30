// Agent Switch Quick Help
// Copyright Mark Skiba, 2025 All rights reserved

// Show help message in console
console.group('🔧 DEBUGGING TOOLS AVAILABLE');
console.log('Agent Switching:');
console.log('📋 showAvailableAgents() - List all agents with IDs');
console.log('🧪 testAgentSwitch("RFP Designer") - Get manual test steps');
console.log('🔍 debugLastResponse() - Debug the last Claude response');
console.log('');
console.log('Supabase Connection:');
console.log('🏥 checkSupabaseHealth(sessionId) - Diagnose connection issues');
console.log('� testSupabaseConnection() - Test basic connectivity');
console.log('');
console.log('�🚨 Look for these warnings in console:');
console.log('   • "MISSED AGENT SWITCH DETECTED" - Claude didn\'t call function');
console.log('   • "net::ERR_FAILED" - Network/Supabase connection issue');
console.log('');
console.log('💡 Quick fixes:');
console.log('   • If switching fails: "Execute the switch_agent function for [agent name]"');
console.log('   • If network errors: Run checkSupabaseHealth() to diagnose');
console.groupEnd();

export {}; // Make this a module