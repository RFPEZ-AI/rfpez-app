// Copyright Mark Skiba, 2025 All rights reserved

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.24.3";

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { message } = body;

    console.log('🧪 DEBUG CLAUDE TEST - Input message:', message);

    // Test with 5 tools to see if tool count affects Claude's decision
    const tools = [
      {
        name: "create_and_set_rfp",
        description: "Create a new RFP and set it as the current RFP",
        input_schema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the RFP"
            },
            description: {
              type: "string", 
              description: "Description of what needs to be sourced"
            }
          },
          required: ["name"]
        }
      },
      {
        name: "get_current_rfp",
        description: "Get the currently active RFP",
        input_schema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get_available_agents",
        description: "Get list of available agents",
        input_schema: {
          type: "object", 
          properties: {},
          required: []
        }
      },
      {
        name: "store_message",
        description: "Store a message in conversation history",
        input_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            session_id: { type: "string" }
          },
          required: ["content"]
        }
      },
      {
        name: "supabase_select",
        description: "Select data from Supabase table",
        input_schema: {
          type: "object",
          properties: {
            table: { type: "string" },
            columns: { type: "string" }
          },
          required: ["table"]
        }
      }
    ];

    // Test with longer system prompt similar to main function (but shorter for testing)  
    const systemPrompt = `You are the RFP Design Agent, a specialist in creating, structuring, and optimizing Request for Proposal (RFP) documents.

🚨 CRITICAL RFP CREATION RULE: When users mention needing to source, procure, buy, or need something for a project, IMMEDIATELY call the create_and_set_rfp function.

🚨 MANDATORY TRIGGER WORDS: If the user says ANY of these phrases, IMMEDIATELY call create_and_set_rfp:
- "need to source"
- "source for" 
- "need an rfp"
- "create rfp"
- "I need to source"
- "source asphalt"
- "procurement"
- "sourcing"

**PRIMARY RESPONSIBILITIES:**
1. **RFP Creation**: Design comprehensive RFP documents that clearly communicate buyer requirements
2. **Requirements Analysis**: Break down complex procurement needs into structured specifications
3. **Vendor Communication**: Craft clear, professional language that attracts quality suppliers
4. **Process Design**: Structure RFP workflows that streamline evaluation and selection

**RFP CREATION WORKFLOW:**
When users request RFP creation, follow this process:
1. IMMEDIATELY call create_and_set_rfp function (DO NOT ask questions first)
2. After RFP creation, gather detailed requirements through targeted questions
3. Structure requirements into clear specifications
4. Design evaluation criteria and scoring methods
5. Create timeline and submission guidelines

**COMMUNICATION STYLE:**
- Professional and authoritative on procurement matters
- Detail-oriented with focus on clarity and completeness
- Proactive in identifying potential procurement challenges
- Structured approach to information gathering

You have access to multiple tools for RFP management, agent switching, conversation history, and database operations. Use create_and_set_rfp immediately when procurement needs are mentioned.

IMPORTANT: Your expertise covers all procurement categories including construction materials, professional services, equipment, supplies, and technology solutions.`;

    console.log('🧪 DEBUG CLAUDE TEST - System prompt length:', systemPrompt.length);
    console.log('🧪 DEBUG CLAUDE TEST - Tools available:', tools.length);
    console.log('🧪 DEBUG CLAUDE TEST - Tool names:', tools.map(t => t.name));

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      tools: tools,
      tool_choice: { type: "auto" }
    });

    console.log('🧪 DEBUG CLAUDE TEST - Response received');
    console.log('🧪 DEBUG CLAUDE TEST - Response content:', JSON.stringify(response.content, null, 2));
    console.log('🧪 DEBUG CLAUDE TEST - Stop reason:', response.stop_reason);
    console.log('🧪 DEBUG CLAUDE TEST - Usage:', response.usage);

    // Check if tools were called
    const toolCalls = response.content.filter(block => block.type === 'tool_use');
    console.log('🧪 DEBUG CLAUDE TEST - Tool calls found:', toolCalls.length);

    if (toolCalls.length === 0) {
      console.log('🧪 DEBUG CLAUDE TEST - ❌ NO TOOLS CALLED despite trigger words!');
      console.log('🧪 DEBUG CLAUDE TEST - Text response:', response.content.filter(b => b.type === 'text').map(b => b.text));
    } else {
      console.log('🧪 DEBUG CLAUDE TEST - ✅ Tools called:', toolCalls.map(tc => tc.name));
    }

    return new Response(JSON.stringify({
      success: true,
      response: response,
      toolsCalled: toolCalls.length,
      debug: {
        systemPromptLength: systemPrompt.length,
        toolsAvailable: tools.length,
        message: message,
        stopReason: response.stop_reason
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Debug test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});