// Copyright Mark Skiba, 2025 All rights reserved

// Debugging utility for RFP Designer agent issues
// This helps identify why RFP Designer returns blank responses

import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';

const debugRFPDesignerIssue = async () => {
  console.log('🔍 DEBUGGING RFP DESIGNER BLANK RESPONSE ISSUE...');
  
  try {
    // Step 1: Get RFP Designer agent
    console.log('📋 Step 1: Getting all agents...');
    const allAgents = await AgentService.getActiveAgents();
    console.log('📋 All active agents:', allAgents.map(a => ({ name: a.name, id: a.id })));
    
    const rfpDesigner = allAgents.find(agent => agent.name === 'RFP Designer');
    if (!rfpDesigner) {
      console.error('❌ RFP Designer agent not found!');
      return { success: false, error: 'RFP Designer agent not found' };
    }
    
    console.log('✅ Step 2: Found RFP Designer agent:', {
      name: rfpDesigner.name,
      id: rfpDesigner.id,
      is_active: rfpDesigner.is_active,
      is_restricted: rfpDesigner.is_restricted,
      is_free: rfpDesigner.is_free
    });

    // Step 3: Test with RFP-triggering message
    const testMessage = "I need an RFP for copper wire";
    console.log('📤 Step 3: Testing with RFP-triggering message:', testMessage);

    let streamedContent = '';
    let chunkCount = 0;
    const onChunk = (chunk: string, isComplete: boolean) => {
      chunkCount++;
      if (!isComplete) {
        streamedContent += chunk;
        console.log(`📡 Chunk ${chunkCount}:`, chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
      } else {
        console.log('✅ Streaming completed');
      }
    };

    console.log('🚀 Step 4: Calling Claude API with specific debugging...');
    console.log('🔧 Call parameters:', {
      message: testMessage,
      agentName: rfpDesigner.name,
      hasSessionId: false, // We're not passing one to isolate the issue
      streaming: true,
      hasStreamCallback: typeof onChunk === 'function'
    });

    const response = await ClaudeService.generateResponse(
      testMessage,
      rfpDesigner,
      [], // empty conversation history
      undefined, // no session ID - testing if this is the issue
      undefined, // no user profile
      null, // no current RFP
      null, // no current artifact
      undefined, // no abort signal
      true, // use streaming
      onChunk // streaming callback
    );

    console.log('🎉 SUCCESS! RFP Designer responded');
    console.log('📄 Response content length:', response.content.length);
    console.log('📄 Response preview:', response.content.substring(0, 300) + '...');
    console.log('🔧 Functions called:', response.metadata.functions_called);
    console.log('📊 Metadata:', {
      model: response.metadata.model,
      tokens_used: response.metadata.tokens_used,
      response_time: response.metadata.response_time,
      is_streaming: response.metadata.is_streaming,
      stream_complete: response.metadata.stream_complete,
      functions_executed: response.metadata.functions_called?.length || 0
    });

    return {
      success: true,
      agent: rfpDesigner.name,
      contentLength: response.content.length,
      functionsUsed: response.metadata.functions_called,
      streamedChunks: chunkCount,
      streamedContentLength: streamedContent.length,
      previewContent: response.content.substring(0, 200)
    };

  } catch (error) {
    console.error('❌ RFP DESIGNER DEBUG FAILED:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500) + '...'
      } : undefined
    };
  }
};

// Add to global window object for browser console access
declare global {
  interface Window {
    __debugRFPDesigner: () => Promise<any>;
  }
}

// Only add in development mode
if (process.env.NODE_ENV === 'development') {
  window.__debugRFPDesigner = debugRFPDesignerIssue;
  console.log('🧪 RFP Designer debug function added to window.__debugRFPDesigner');
}

export { debugRFPDesignerIssue };