// Copyright Mark Skiba, 2025 All rights reserved
// RFP management tools implementation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('DATABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('DATABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}
const supabase = createClient(supabaseUrl, supabaseKey);
// Version that accepts an authenticated Supabase client
export async function createAndSetRfpWithClient(authenticatedSupabase, parameters, sessionContext) {
  console.log('🎯 Creating and setting RFP with authenticated client:', parameters);
  console.log('🔍 DEBUG: parameters.name received:', parameters.name);
  console.log('🔍 DEBUG: typeof parameters.name:', typeof parameters.name);
  console.log('🔍 DEBUG: full parameters object:', JSON.stringify(parameters, null, 2));
  try {
    // Validate required name parameter
    if (!parameters.name || parameters.name.trim() === '') {
      throw new Error('RFP name is required. Please provide a descriptive name that includes what is being procured.');
    }
    // Reject generic names
    const genericNames = [
      'New RFP',
      'RFP',
      'Untitled RFP',
      'Draft RFP'
    ];
    if (genericNames.includes(parameters.name.trim())) {
      throw new Error(`Generic RFP name "${parameters.name}" is not allowed. Please provide a descriptive name like "Industrial Use Alcohol RFP" or "Floor Tiles RFP".`);
    }
    // Get the user's UUID from the authenticated session
    const { data: userData, error: userError } = await authenticatedSupabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      console.error('❌ Failed to get authenticated user:', userError);
      throw new Error('Authentication required to create RFP');
    }
    const userId = userData.user.id;
    console.log('📝 Creating RFP via SECURITY DEFINER function for user:', userId);
    // Use the SECURITY DEFINER RPC function to create RFP (bypasses RLS)
    const rpcResult = await authenticatedSupabase.rpc('create_rfp_for_user', {
      p_user_uuid: userId,
      p_name: parameters.name.trim(),
      p_description: parameters.description || null,
      p_specification: parameters.specification || null,
      p_due_date: parameters.due_date || null,
      p_session_id: sessionContext?.sessionId || null
    }).single();
    const { data: rfpResultData, error: rpcError } = rpcResult;
    if (rpcError) {
      console.error('❌ RFP creation error:', rpcError);
      const errorMessage = rpcError.message || 'Unknown error';
      throw new Error(`Failed to create RFP: ${errorMessage}`);
    }
    if (!rfpResultData || !rfpResultData.success) {
      const errorMsg = rfpResultData?.message || 'Unknown error';
      console.error('❌ RFP creation failed:', errorMsg);
      throw new Error(`Failed to create RFP: ${errorMsg}`);
    }
    console.log('✅ RFP created successfully:', rfpResultData);
    // Build the response object
    const rfpRecord = {
      id: rfpResultData.rfp_id,
      name: rfpResultData.rfp_name,
      description: rfpResultData.rfp_description,
      created_at: rfpResultData.rfp_created_at
    };
    // FIX 3: Create a new session for the new RFP (per user requirement)
    let newSessionId = sessionContext?.sessionId;
    try {
      console.log('🆕 Creating new session for RFP:', rfpRecord.name);
      // Import createSession from database tools
      const { createSession } = await import('./database.ts');
      // Create new session with RFP name as title
      // @ts-expect-error - Type compatibility between Supabase client interfaces
      const sessionResult = await createSession(authenticatedSupabase, {
        userId: userId,
        title: String(rfpRecord.name || 'New RFP Session'),
        agentId: sessionContext?.agent?.id // Preserve current agent if available
      });
      if (sessionResult && sessionResult.session_id) {
        newSessionId = sessionResult.session_id;
        console.log('✅ New session created:', newSessionId, 'with title:', rfpRecord.name);
        // FIX 2: Set current_rfp_id in the new session
        const { error: updateError } = await authenticatedSupabase.from('sessions').update({
          current_rfp_id: rfpRecord.id
        }).eq('id', newSessionId);
        if (updateError) {
          console.warn('⚠️ Failed to set current RFP in new session:', updateError);
        } else {
          console.log('✅ Current RFP set in new session');
        }
      }
    } catch (sessionError) {
      console.error('❌ Error creating new session:', sessionError);
      // Fall back to updating existing session if session creation fails
      console.log('⚠️ Falling back to updating existing session:', sessionContext?.sessionId);
      if (sessionContext?.sessionId) {
        const { error: updateError } = await authenticatedSupabase.from('sessions').update({
          current_rfp_id: rfpRecord.id,
          title: String(rfpRecord.name || 'Untitled RFP') // FIX 2: Update session title with RFP name
        }).eq('id', sessionContext.sessionId);
        if (updateError) {
          console.warn('⚠️ Failed to update existing session:', updateError);
        } else {
          console.log('✅ Existing session updated with current RFP and title');
        }
      }
    }
    // Return success response with client callbacks
    // If we created a new session, include session_switch callback
    const callbacks = [
      {
        type: 'ui_refresh',
        target: 'rfp_context',
        payload: {
          rfp_id: rfpRecord.id,
          rfp_name: String(rfpRecord.name || 'Untitled'),
          rfp_data: rfpRecord,
          session_id: newSessionId,
          message: `RFP "${String(rfpRecord.name || 'Untitled')}" has been created successfully`
        },
        priority: 'high'
      }
    ];
    // Add session switch callback if we created a new session
    if (newSessionId && newSessionId !== sessionContext?.sessionId) {
      callbacks.push({
        type: 'ui_refresh',
        target: 'session_switch',
        payload: {
          session_id: newSessionId,
          rfp_id: rfpRecord.id,
          rfp_name: String(rfpRecord.name || 'Untitled'),
          message: `Switched to new session for RFP "${String(rfpRecord.name || 'Untitled')}"`
        },
        priority: 'high'
      });
    }
    return {
      success: true,
      data: rfpRecord,
      current_rfp_id: rfpRecord.id,
      rfp: undefined,
      message: `RFP "${String(rfpRecord.name || 'Untitled')}" created successfully with ID ${String(rfpRecord.id || '')}${newSessionId !== sessionContext?.sessionId ? ' in new session' : ''}`,
      clientCallbacks: callbacks
    };
  } catch (error) {
    console.error('❌ createAndSetRfpWithClient error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}
// Original version using service role client (kept for backward compatibility)
export async function createAndSetRfp(parameters, sessionContext) {
  console.log('🎯 Creating and setting RFP:', parameters);
  console.log('🔍 DEBUG: parameters.name received:', parameters.name);
  console.log('🔍 DEBUG: typeof parameters.name:', typeof parameters.name);
  console.log('🔍 DEBUG: full parameters object:', JSON.stringify(parameters, null, 2));
  try {
    // Validate required name parameter
    if (!parameters.name || parameters.name.trim() === '') {
      throw new Error('RFP name is required. Please provide a descriptive name that includes what is being procured.');
    }
    // Reject generic names
    const genericNames = [
      'New RFP',
      'RFP',
      'Untitled RFP',
      'Draft RFP'
    ];
    if (genericNames.includes(parameters.name.trim())) {
      throw new Error(`Generic RFP name "${parameters.name}" is not allowed. Please provide a descriptive name like "Industrial Use Alcohol RFP" or "Floor Tiles RFP".`);
    }
    // Build RFP data using actual database schema
    const rfpData = {
      name: parameters.name.trim(),
      description: parameters.description || null,
      specification: parameters.specification || null,
      due_date: parameters.due_date || null,
      status: 'draft',
      created_at: new Date().toISOString(),
      is_template: false,
      is_public: false,
      completion_percentage: 0
    };
    console.log('📝 Inserting RFP with data:', rfpData);
    // Insert RFP into database
    const { data: newRfp, error: insertError } = await supabase.from('rfps').insert([
      rfpData
    ]).select().single();
    if (insertError) {
      console.error('❌ RFP creation error:', insertError);
      throw new Error(`Failed to create RFP: ${insertError.message}`);
    }
    console.log('✅ RFP created successfully:', newRfp);
    // Update session to set current RFP if sessionId is provided
    if (sessionContext?.sessionId) {
      console.log('🔗 Setting current RFP in session:', sessionContext.sessionId);
      const { error: updateError } = await supabase.from('sessions').update({
        current_rfp_id: newRfp.id
      }).eq('id', sessionContext.sessionId);
      if (updateError) {
        console.warn('⚠️ Failed to set current RFP in session:', updateError);
      // Don't fail the whole operation for this
      } else {
        console.log('✅ Current RFP set in session');
      }
    }
    // Return success response with client callbacks
    return {
      success: true,
      data: newRfp,
      current_rfp_id: newRfp.id,
      rfp: newRfp,
      message: `RFP "${newRfp.name}" created successfully with ID ${newRfp.id}`,
      clientCallbacks: [
        {
          type: 'ui_refresh',
          target: 'rfp_context',
          payload: {
            rfp_id: newRfp.id,
            rfp_name: newRfp.name,
            rfp_data: newRfp,
            message: `RFP "${newRfp.name}" has been created successfully`
          },
          priority: 'high'
        }
      ]
    };
  } catch (error) {
    console.log('❌ createAndSetRfp error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}
/**
 * Get bid details by ID and automatically set the associated RFP as current context
 * This is used when a supplier visits a bid invitation link with ?bid_id=X
 */ export async function getBid(parameters, sessionContext) {
  const bidId = typeof parameters.bid_id === 'string' ? parseInt(parameters.bid_id, 10) : parameters.bid_id;
  console.log('🔍 Getting bid details:', {
    bidId,
    sessionId: sessionContext?.sessionId
  });
  try {
    // Fetch bid from database
    const { data: bid, error: bidError } = await supabase.from('bids').select('id, rfp_id, supplier_id, status, created_at, updated_at').eq('id', bidId).single();
    if (bidError || !bid) {
      console.error('❌ Bid lookup error:', bidError);
      return {
        success: false,
        error: `Bid #${bidId} not found`,
        data: null,
        message: `I couldn't find bid #${bidId} in the system. Please check the bid ID and try again.`
      };
    }
    console.log('✅ Bid found:', bid);
    // Fetch the associated RFP
    const { data: rfp, error: rfpError } = await supabase.from('rfps').select('id, name, description, status, created_at, updated_at, account_id').eq('id', bid.rfp_id).single();
    if (rfpError || !rfp) {
      console.error('❌ RFP lookup error:', rfpError);
      return {
        success: false,
        error: `RFP #${bid.rfp_id} not found`,
        data: {
          bid
        },
        message: `Found bid #${bidId}, but couldn't load the associated RFP #${bid.rfp_id}`
      };
    }
    console.log('✅ RFP found for bid:', rfp);
    // Update session to set current RFP if sessionId is provided
    if (sessionContext?.sessionId) {
      console.log('🔗 Setting current RFP in session:', sessionContext.sessionId);
      const { error: updateError } = await supabase.from('sessions').update({
        current_rfp_id: rfp.id
      }).eq('id', sessionContext.sessionId);
      if (updateError) {
        console.warn('⚠️ Failed to set current RFP in session:', updateError);
      } else {
        console.log('✅ Current RFP set in session');
      }
    }
    // Return success with both bid and RFP information
    return {
      success: true,
      data: {
        bid,
        rfp
      },
      current_rfp_id: rfp.id,
      rfp: rfp,
      message: `✅ Congratulations! You've been invited to bid on "${rfp.name}" (RFP #${rfp.id}). Your bid status is: ${bid.status}.`,
      clientCallbacks: [
        {
          type: 'ui_refresh',
          target: 'rfp_context',
          payload: {
            rfp_id: rfp.id,
            rfp_name: rfp.name,
            rfp_data: rfp,
            bid_id: bid.id,
            bid_status: bid.status,
            message: `You've been invited to bid on "${rfp.name}"`
          },
          priority: 'high'
        }
      ]
    };
  } catch (error) {
    console.error('❌ getBid error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
      message: `Error looking up bid #${bidId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
