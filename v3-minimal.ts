// Copyright Mark Skiba, 2025 All rights reserved
// Claude API Edge Function v3 - Message Format Fix

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.29.0';

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Anthropic
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');
const anthropic = new Anthropic({ apiKey: anthropicApiKey });

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
};

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const requestBody = await req.json();
    console.log('📨 V3 Message Format Test');

    // Validate messages array for direct API calls
    if (!requestBody.userMessage && (!requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: messages array is required and must not be empty',
        message: 'Please provide a messages array with at least one message'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Handle frontend-style requests (userMessage)
    if (requestBody.userMessage) {
      console.log('🔄 Processing frontend request with message format fix');
      
      const messages = [];
      
      // Add conversation history with proper format
      if (requestBody.conversationHistory && requestBody.conversationHistory.length > 0) {
        for (const historyMessage of requestBody.conversationHistory) {
          if (typeof historyMessage.content === 'string') {
            messages.push({
              role: historyMessage.role,
              content: [{ type: 'text', text: historyMessage.content }]
            });
          } else {
            messages.push(historyMessage);
          }
        }
      }
      
      // Add current user message with proper format
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: requestBody.userMessage }]
      });

      // System prompt
      const systemPrompt = requestBody.agent?.instructions || 'You are a helpful AI assistant.';

      console.log('🎯 Making Claude API call with fixed message format');

      // Define tools for form creation
      const tools = [
        {
          name: 'create_form_artifact',
          description: 'Create an interactive form artifact in the UI for data collection',
          input_schema: {
            type: 'object',
            properties: {
              session_id: { type: 'string', description: 'Current session ID' },
              title: { type: 'string', description: 'Form title' },
              form_schema: { type: 'object', description: 'JSON Schema for the form' },
              ui_schema: { type: 'object', description: 'UI configuration' },
              submit_action: { type: 'string', description: 'Action on form submit' },
              artifact_role: { type: 'string', description: 'Role of the artifact' }
            },
            required: ['session_id', 'title', 'form_schema']
          }
        }
      ];

      // Make Claude API call with tools
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages,
        tools: tools,
        stream: false
      });

      // Process tool calls and extract response
      let textResponse = '';
      let functionsExecuted = [];
      let toolResults = [];
      
      if (response.content && response.content.length > 0) {
        for (const contentBlock of response.content) {
          if (contentBlock.type === 'text') {
            textResponse += contentBlock.text;
          } else if (contentBlock.type === 'tool_use') {
            // For now, just log tool calls and return success
            console.log(`🔧 Tool called: ${contentBlock.name}`);
            functionsExecuted.push(contentBlock.name);
            
            // Mock successful tool execution for testing
            toolResults.push({
              tool_use_id: contentBlock.id,
              type: 'tool_result',
              content: JSON.stringify({
                success: true,
                message: `Mock ${contentBlock.name} executed successfully`,
                artifact_id: `mock_${Date.now()}`
              })
            });
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        response: textResponse || 'Response received successfully.',
        functionsExecuted: functionsExecuted,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
        usage: response.usage,
        model: response.model,
        messageFormatFixed: true
      }), {
        headers: corsHeaders
      });
    }

    // Handle direct Claude API requests
    const response = await anthropic.messages.create({
      model: requestBody.model || 'claude-sonnet-4-20250514',
      max_tokens: requestBody.max_tokens || 4000,
      temperature: requestBody.temperature || 0.3,
      system: requestBody.system || '',
      messages: requestBody.messages,
      tools: requestBody.tools || [],
      tool_choice: { type: 'auto' }
    });

    return new Response(JSON.stringify({
      success: true,
      data: response,
      metadata: {
        model: response.model,
        usage: response.usage
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ V3 error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

console.log('🚀 Claude API v3 Message Format Fix ready');