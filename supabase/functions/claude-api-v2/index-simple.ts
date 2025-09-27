// This is a simplified version for testing - replace the complex continuation logic
// TODO: Replace the entire continuation section with this simpler approach

// If tools were executed, send tool results directly in completion for now
if (toolsExecuted && toolResults.length > 0) {
  console.log('🔧 DEBUG - Tools executed, sending results directly');
  
  // Create a readable summary of tool results
  const toolResultsSummary = toolResults.map(tr => {
    if (tr.error) {
      return `Error with ${tr.tool_name}: ${tr.error}`;
    }
    
    const result = tr.result.data || tr.result;
    
    // Format the result based on tool type
    if (tr.tool_name === 'get_available_agents' && result.agents) {
      const agentList = result.agents.map(agent => 
        `• ${agent.name} (${agent.role}) - ${agent.instructions?.substring(0, 100) || 'No description available'}...`
      ).join('\n');
      return `Available agents (${result.count} total):\n${agentList}`;
    }
    
    // Default formatting for other tools
    return JSON.stringify(result, null, 2);
  }).join('\n\n');
  
  // Send completion with tool results
  const completionContent = fullContent + '\n\n' + toolResultsSummary;
  
  const sseData = JSON.stringify({
    type: 'complete',
    full_content: completionContent,
    token_count: tokenCount,
    tool_results: toolResults,
  });
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
  
  console.log('✅ Claude streaming response completed with direct tool results');
  controller.close();
  return;
}