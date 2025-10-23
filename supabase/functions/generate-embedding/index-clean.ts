// Generate text embeddings for semantic search
// Uses simple TF-IDF based embeddings for fast local processing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmbeddingRequest {
  text: string;
}

// Simple function to generate a deterministic embedding from text
// Uses a hash-based approach to create a 384-dimensional vector
function generateSimpleEmbedding(text: string): number[] {
  const dimensions = 384;
  const embedding = new Array(dimensions).fill(0);
  
  // Normalize text
  const normalized = text.toLowerCase().trim();
  
  // Split into words and create TF-IDF-like features
  const words = normalized.split(/\s+/);
  const wordFreq = new Map<string, number>();
  
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }
  
  // Generate embedding based on word frequencies and positions
  for (const [word, freq] of wordFreq.entries()) {
    // Simple hash function to map words to dimensions
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use hash to determine which dimensions to update
    const dim1 = Math.abs(hash) % dimensions;
    const dim2 = Math.abs(hash >> 8) % dimensions;
    const dim3 = Math.abs(hash >> 16) % dimensions;
    
    // Update multiple dimensions based on word frequency
    const value = freq / words.length; // Normalize by document length
    embedding[dim1] += value;
    embedding[dim2] += value * 0.5;
    embedding[dim3] += value * 0.25;
  }
  
  // Normalize the embedding vector to unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }
  
  return embedding;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log(`Generating embedding for text of length: ${text.length}`);

    // Generate embedding locally (fast, no external API calls)
    const embedding = generateSimpleEmbedding(text.slice(0, 8000));

    console.log(`Generated ${embedding.length}-dimensional embedding`);

    return new Response(
      JSON.stringify({ embedding }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
