// Quick test to verify agent switch detection works
const testResponse = {
  content: "I've switched to the Bid Design Agent. How can I help you design your bid?",
  metadata: {
    model: "claude-3-5-sonnet-latest",
    tokens_used: 150,
    response_time: 1200,
    temperature: 0.7,
    functions_called: ["switch_agent"],
    function_results: [
      {
        function: "switch_agent",
        result: { success: true, agent_name: "Bid Design Agent" }
      }
    ],
    agent_switch_occurred: true,
    agent_switch_result: { success: true, agent_name: "Bid Design Agent" }
  }
};

// Test the detection logic
const agentSwitchOccurred = testResponse.metadata.functions_called?.includes('switch_agent') || false;
console.log('Agent switch detected:', agentSwitchOccurred);
console.log('Agent switch occurred flag:', testResponse.metadata.agent_switch_occurred);
console.log('Agent switch result:', testResponse.metadata.agent_switch_result);

if (testResponse.metadata.agent_switch_occurred) {
  console.log('✅ UI refresh would be triggered');
} else {
  console.log('❌ UI refresh would NOT be triggered');
}
