// Copyright Mark Skiba, 2025 All rights reserved
// RFP management tools implementation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { RFPFormData, SessionContext, ToolResult } from '../types.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export async function createAndSetRfp(parameters: RFPFormData, sessionContext?: SessionContext): Promise<ToolResult> {
  console.log('🎯 Creating and setting RFP:', parameters);
  console.log('🔍 DEBUG: parameters.name received:', parameters.name);
  console.log('🔍 DEBUG: typeof parameters.name:', typeof parameters.name);
  console.log('🔍 DEBUG: full parameters object:', JSON.stringify(parameters, null, 2));
  
  try {
    // Build RFP data using actual database schema
    const rfpData = {
      name: parameters.name || 'New RFP',
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
    const { data: newRfp, error: insertError } = await supabase
      .from('rfps')
      .insert([rfpData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ RFP creation error:', insertError);
      throw new Error(`Failed to create RFP: ${insertError.message}`);
    }
    
    console.log('✅ RFP created successfully:', newRfp);
    
    // Update session to set current RFP if sessionId is provided
    if (sessionContext?.sessionId) {
      console.log('🔗 Setting current RFP in session:', sessionContext.sessionId);
      
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ current_rfp_id: newRfp.id })
        .eq('id', sessionContext.sessionId);
      
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
    console.error('❌ createAndSetRfp error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}