// Copyright Mark Skiba, 2025 All rights reserved
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as postgres from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-platform',
};

interface GetBidsRequest {
  rfp_id: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let client;

  try {
    // Parse request body
    const { rfp_id } = await req.json() as GetBidsRequest;

    if (!rfp_id) {
      return new Response(
        JSON.stringify({ error: 'rfp_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Querying bids for RFP ID: ${rfp_id}`);

    // Connect directly to PostgreSQL (bypasses PostgREST entirely)
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL') || 
                       Deno.env.get('DATABASE_URL') ||
                       'postgresql://postgres:postgres@db:5432/postgres';
    
    console.log(`Connecting to database: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`);

    const pool = new postgres.Pool(databaseUrl, 3, true);
    client = await pool.connect();

    // Raw SQL query to get bids
    const result = await client.queryObject`
      SELECT 
        id,
        rfp_id,
        agent_id,
        supplier_id,
        response,
        created_at,
        updated_at
      FROM bids
      WHERE rfp_id = ${rfp_id}
      ORDER BY created_at DESC
    `;

    const bids = result.rows;
    console.log(`Raw SQL query returned ${bids.length} bids`);

    return new Response(
      JSON.stringify({ 
        bids: bids,
        debug: { 
          rfp_id, 
          count: bids.length,
          method: 'raw_sql' 
        } 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } finally {
    // Release the client back to the pool
    if (client) {
      try {
        await client.release();
      } catch (e) {
        console.error('Error releasing client:', e);
      }
    }
  }
});
