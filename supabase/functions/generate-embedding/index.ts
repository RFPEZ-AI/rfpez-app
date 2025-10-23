// Generate text embeddings for semantic search
// Voyage AI multilingual embeddings (1024 dimensions)
// voyage-2 model: multilingual, cost-effective, high quality

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmbeddingRequest {
  text: string;
}

/**
 * Generate 1024-dimensional embedding using Voyage AI
 * Model: voyage-2 (multilingual, optimized for semantic search)
 */
async function generateVoyageEmbedding(text: string): Promise<number[]> {
  console.log('[Info] Generating 1024-dimensional Voyage AI embedding...');
  
  const apiKey = Deno.env.get('VOYAGE_API_KEY');
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY environment variable not set');
  }
  
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'voyage-2',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Error] Voyage AI API error:', response.status, errorText);
      throw new Error(`Voyage AI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      console.error('[Error] Unexpected Voyage AI response format:', JSON.stringify(data));
      throw new Error('Invalid response format from Voyage AI');
    }
    
    const embedding = data.data[0].embedding;
    console.log(`[Info] Generated ${embedding.length}-dimensional embedding`);
    console.log(`[Info] Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
    
    return embedding;
  } catch (error) {
    console.error('[Error] Failed to generate Voyage AI embedding:', error);
    throw error;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text } = await req.json() as EmbeddingRequest;

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Info] Generating embedding for text of length: ${text.length}`);

    const embedding = await generateVoyageEmbedding(text);

    console.log(`[Info] Successfully generated ${embedding.length}-dimensional embedding`);

    return new Response(
      JSON.stringify({ embedding }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating embedding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
