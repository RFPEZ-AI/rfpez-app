// Copyright Mark Skiba, 2025 All rights reserved
// Perplexity AI integration for web search and research capabilities
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const PERPLEXITY_TIMEOUT_MS = parseInt(Deno.env.get('PERPLEXITY_TIMEOUT_MS') || '300000'); // 5 minutes default
/**
 * Execute Perplexity Search API call
 * Direct web search using the Perplexity Search API
 */ async function executePerplexitySearch(params) {
  if (!PERPLEXITY_API_KEY) {
    return {
      success: false,
      error: 'PERPLEXITY_API_KEY not configured',
      message: 'Perplexity API key is required for search functionality'
    };
  }
  try {
    console.log('🔍 Executing Perplexity Search:', params.query);
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), PERPLEXITY_TIMEOUT_MS);
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: params.query,
        recency_filter: params.recency_filter,
        return_images: params.return_images ?? false,
        return_related_questions: params.return_related_questions ?? true
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity Search API error:', response.status, errorText);
      return {
        success: false,
        error: `Perplexity API error: ${response.status}`,
        message: errorText
      };
    }
    const data = await response.json();
    console.log('✅ Perplexity Search completed successfully');
    return {
      success: true,
      results: data.choices?.[0]?.message?.content || '',
      citations: data.citations || [],
      related_questions: data.related_questions || [],
      images: data.images || []
    };
  } catch (error) {
    console.error('❌ Perplexity Search execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to execute Perplexity search'
    };
  }
}
/**
 * Execute Perplexity Ask - conversational AI with real-time web search
 * Uses the sonar-pro model for quick questions and everyday searches
 */ async function executePerplexityAsk(params) {
  if (!PERPLEXITY_API_KEY) {
    return {
      success: false,
      error: 'PERPLEXITY_API_KEY not configured',
      message: 'Perplexity API key is required for ask functionality'
    };
  }
  try {
    console.log('💬 Executing Perplexity Ask:', params.query);
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), PERPLEXITY_TIMEOUT_MS);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'user',
            content: params.query
          }
        ],
        search_recency_filter: params.search_recency_filter
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity Ask API error:', response.status, errorText);
      return {
        success: false,
        error: `Perplexity API error: ${response.status}`,
        message: errorText
      };
    }
    const data = await response.json();
    console.log('✅ Perplexity Ask completed successfully');
    return {
      success: true,
      answer: data.choices?.[0]?.message?.content || '',
      citations: data.citations || []
    };
  } catch (error) {
    console.error('❌ Perplexity Ask execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to execute Perplexity ask'
    };
  }
}
/**
 * Execute Perplexity Research - deep comprehensive research
 * Uses the sonar-deep-research model for thorough analysis and detailed reports
 */ async function executePerplexityResearch(params) {
  if (!PERPLEXITY_API_KEY) {
    return {
      success: false,
      error: 'PERPLEXITY_API_KEY not configured',
      message: 'Perplexity API key is required for research functionality'
    };
  }
  try {
    console.log('📚 Executing Perplexity Research:', params.query);
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), PERPLEXITY_TIMEOUT_MS);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: params.query
          }
        ],
        search_recency_filter: params.search_recency_filter
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity Research API error:', response.status, errorText);
      return {
        success: false,
        error: `Perplexity API error: ${response.status}`,
        message: errorText
      };
    }
    const data = await response.json();
    console.log('✅ Perplexity Research completed successfully');
    return {
      success: true,
      research_report: data.choices?.[0]?.message?.content || '',
      citations: data.citations || []
    };
  } catch (error) {
    console.error('❌ Perplexity Research execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to execute Perplexity research'
    };
  }
}
/**
 * Execute Perplexity Reason - advanced reasoning and problem-solving
 * Uses the sonar-reasoning-pro model for complex analytical tasks
 */ async function executePerplexityReason(params) {
  if (!PERPLEXITY_API_KEY) {
    return {
      success: false,
      error: 'PERPLEXITY_API_KEY not configured',
      message: 'Perplexity API key is required for reasoning functionality'
    };
  }
  try {
    console.log('🧠 Executing Perplexity Reason:', params.query);
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), PERPLEXITY_TIMEOUT_MS);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [
          {
            role: 'user',
            content: params.query
          }
        ]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity Reason API error:', response.status, errorText);
      return {
        success: false,
        error: `Perplexity API error: ${response.status}`,
        message: errorText
      };
    }
    const data = await response.json();
    console.log('✅ Perplexity Reason completed successfully');
    return {
      success: true,
      reasoning: data.choices?.[0]?.message?.content || '',
      citations: data.citations || []
    };
  } catch (error) {
    console.error('❌ Perplexity Reason execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to execute Perplexity reasoning'
    };
  }
}
export { executePerplexitySearch, executePerplexityAsk, executePerplexityResearch, executePerplexityReason };
