// Agent Switch Debugging and Fix Utility
// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This utility helps debug and fix agent switching issues where Claude
 * responds with text about switching agents but doesn't call the function
 */

class AgentSwitchDebugger {
  private static instance: AgentSwitchDebugger;

  static getInstance(): AgentSwitchDebugger {
    if (!AgentSwitchDebugger.instance) {
      AgentSwitchDebugger.instance = new AgentSwitchDebugger();
    }
    return AgentSwitchDebugger.instance;
  }

  /**
   * Check if a Claude response mentions agent switching but didn't call the function
   */
  detectMissedAgentSwitch(
    response: string, 
    functionsExecuted: string[]
  ): { shouldHaveSwitched: boolean; suggestedAgent?: string } {
    const switchKeywords = [
      'switching you to',
      'transfer you to',
      'connect you with',
      'let me switch to',
      'switching to the',
      'transfer to the',
      'connect with the'
    ];

    const agentKeywords = {
      'rfp designer': 'RFP Designer',
      'rfp design': 'RFP Designer', 
      'designer': 'RFP Designer',
      'design agent': 'RFP Designer',
      'technical support': 'Technical Support',
      'tech support': 'Technical Support',
      'support agent': 'Technical Support',
      'solutions': 'Solutions',
      'solutions agent': 'Solutions',
      'sales': 'Solutions',
      'assistant': 'RFP Assistant',
      'rfp assistant': 'RFP Assistant'
    };

    const lowerResponse = response.toLowerCase();
    
    // Check if response mentions switching
    const mentionsSwitching = switchKeywords.some(keyword => 
      lowerResponse.includes(keyword)
    );

    if (!mentionsSwitching) {
      return { shouldHaveSwitched: false };
    }

    // Check if switch_agent function was actually called
    const functionWasCalled = functionsExecuted.includes('switch_agent');
    
    if (functionWasCalled) {
      return { shouldHaveSwitched: false }; // Function was called, no issue
    }

    // Function wasn't called but switching was mentioned - find suggested agent
    let suggestedAgent: string | undefined;
    for (const [keyword, agentName] of Object.entries(agentKeywords)) {
      if (lowerResponse.includes(keyword)) {
        suggestedAgent = agentName;
        break;
      }
    }

    return {
      shouldHaveSwitched: true,
      suggestedAgent
    };
  }

  /**
   * Log debugging information about a missed agent switch
   */
  logMissedSwitch(response: string, suggestedAgent?: string) {
    console.group('⚠️ MISSED AGENT SWITCH DETECTED');
    console.log('Claude mentioned switching agents but didn\'t call switch_agent function');
    console.log('Response text:', response.slice(0, 200) + '...');
    if (suggestedAgent) {
      console.log('Suggested agent:', suggestedAgent);
      console.log('💡 Try sending: "Please switch to the ' + suggestedAgent + ' agent"');
    }
    console.log('🔧 This indicates Claude needs more explicit instructions to call functions');
    console.groupEnd();
  }
}

// Initialize and export
const agentSwitchDebugger = AgentSwitchDebugger.getInstance();
export default agentSwitchDebugger;

// Make available globally for debugging
(window as any).debugAgentSwitch = agentSwitchDebugger;