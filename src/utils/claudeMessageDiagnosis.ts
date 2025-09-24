// Copyright Mark Skiba, 2025 All rights reserved

// Detailed diagnostic for RFP Designer message display issue
// This helps identify if the problem is in streaming, function calls, or UI updates

import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';
import type { Agent } from '../types/database';

interface StreamingLogEntry {
  chunkNumber: number;
  timestamp: string;
  isComplete: boolean;
  chunkLength: number;
  chunkPreview: string;
  chunkContent: string;
}

interface DiagnosisResult {
  success: boolean;
  responseContentLength?: number;
  totalStreamedChars?: number;
  messageCount?: number;
  timestamps?: string[];
  activeSession?: string | null;
  analysis?: string;
  discrepancies?: string[];
  streamingLog?: StreamingLogEntry[];
  error?: string;
  stack?: string;
  diagnosis?: string;
}

const diagnoseClaudeMessageDisplay = async () => {
  console.log('🔬 STARTING CLAUDE MESSAGE DISPLAY DIAGNOSIS...');
  
  try {
    // Step 1: Get RFP Designer agent
    const allAgents = await AgentService.getActiveAgents();
    const rfpDesigner = allAgents.find(agent => agent.name === 'RFP Designer');
    
    if (!rfpDesigner) {
      console.error('❌ RFP Designer agent not found!');
      return { success: false, error: 'RFP Designer agent not found' };
    }

    console.log('✅ Found RFP Designer agent:', rfpDesigner.name);

    // Step 2: Test with detailed streaming monitoring
    const testMessage = "I need an RFP for office supplies";
    console.log('📤 Testing with message:', testMessage);

    const streamingLog: StreamingLogEntry[] = [];
    let chunkCount = 0;
    let totalStreamedLength = 0;

    const detailedStreamingCallback = (chunk: string, isComplete: boolean) => {
      chunkCount++;
      const logEntry: StreamingLogEntry = {
        chunkNumber: chunkCount,
        timestamp: new Date().toISOString(),
        isComplete,
        chunkLength: chunk ? chunk.length : 0,
        chunkPreview: chunk ? chunk.substring(0, 100) : 'null',
        chunkContent: chunk || ''
      };
      
      streamingLog.push(logEntry);
      
      if (!isComplete && chunk) {
        totalStreamedLength += chunk.length;
        console.log(`📡 Streaming chunk ${chunkCount} (${chunk.length} chars):`, chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
      } else if (isComplete) {
        console.log('🏁 Streaming marked complete');
      }
    };

    console.log('🚀 Calling Claude API with detailed monitoring...');
    const startTime = Date.now();
    
    const response = await ClaudeService.generateResponse(
      testMessage,
      rfpDesigner,
      [], // empty conversation history
      undefined, // no session ID - testing without session
      undefined, // no user profile
      null, // no current RFP
      null, // no current artifact
      undefined, // no abort signal
      true, // use streaming
      detailedStreamingCallback
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('🎉 Claude API call completed!');
    console.log('⏱️ Duration:', duration + 'ms');

    // Step 3: Analyze the results
    const analysis = {
      responseContentLength: response.content ? response.content.length : 0,
      responsePreview: response.content ? response.content.substring(0, 200) + '...' : 'EMPTY OR NULL',
      streamingChunks: chunkCount,
      totalStreamedChars: totalStreamedLength,
      functionsExecuted: response.metadata.functions_called || [],
      wasStreaming: response.metadata.is_streaming,
      streamComplete: response.metadata.stream_complete,
      tokensUsed: response.metadata.tokens_used,
      responseTime: response.metadata.response_time,
      model: response.metadata.model
    };

    console.log('📊 ANALYSIS RESULTS:');
    console.log('═══════════════════════════════════════');
    console.log('Final response content length:', analysis.responseContentLength);
    console.log('Response preview:', analysis.responsePreview);
    console.log('Streaming chunks received:', analysis.streamingChunks);
    console.log('Total streamed characters:', analysis.totalStreamedChars);
    console.log('Functions executed:', analysis.functionsExecuted);
    console.log('Was streaming:', analysis.wasStreaming);
    console.log('Stream complete:', analysis.streamComplete);
    console.log('Model used:', analysis.model);
    console.log('Tokens used:', analysis.tokensUsed);
    console.log('Response time:', analysis.responseTime + 'ms');

    // Step 4: Check for discrepancies
    const discrepancies = [];
    
    if (analysis.responseContentLength === 0) {
      discrepancies.push('⚠️ CRITICAL: Final response content is empty!');
    }
    
    if (analysis.totalStreamedChars === 0) {
      discrepancies.push('⚠️ CRITICAL: No content was streamed!');
    }
    
    if (analysis.responseContentLength !== analysis.totalStreamedChars) {
      discrepancies.push(`⚠️ MISMATCH: Final content length (${analysis.responseContentLength}) != streamed length (${analysis.totalStreamedChars})`);
    }
    
    if (analysis.functionsExecuted.length > 0 && analysis.responseContentLength === 0) {
      discrepancies.push('⚠️ PATTERN: Functions executed but no text content - typical of function-only responses');
    }

    console.log('🔍 DISCREPANCIES FOUND:');
    discrepancies.forEach(d => console.log(d));

    // Step 5: Raw streaming log for detailed analysis
    console.log('📋 RAW STREAMING LOG:');
    streamingLog.forEach((entry, index) => {
      console.log(`Chunk ${index + 1}:`, {
        timestamp: entry.timestamp,
        isComplete: entry.isComplete,
        length: entry.chunkLength,
        preview: entry.chunkPreview
      });
    });

    return {
      success: true,
      analysis,
      discrepancies,
      streamingLog,
      diagnosis: discrepancies.length > 0 ? 'Issues detected' : 'Streaming appears normal'
    };

  } catch (error) {
    console.error('❌ DIAGNOSIS FAILED:', error);
    const errorObj = error as Error;
    return {
      success: false,
      error: errorObj.message || 'Unknown error',
      stack: errorObj.stack || 'No stack trace available'
    };
  }
};

// Add to global window object for browser console access
declare global {
  interface Window {
    __diagnoseClaude: () => Promise<any>;
  }
}

// Only add in development mode
if (process.env.NODE_ENV === 'development') {
  window.__diagnoseClaude = diagnoseClaudeMessageDisplay;
  console.log('🔬 Claude diagnosis function added to window.__diagnoseClaude');
}

export { diagnoseClaudeMessageDisplay };