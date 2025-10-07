// Copyright Mark Skiba, 2025 All rights reserved
// RFP management tools implementation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { RFPFormData, SessionContext, ToolResult } from '../types.ts'

// Interface for Supabase client operations
interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  auth: {
    getUser: () => Promise<{ data: { user: Record<string, unknown> } | null; error: unknown }>;
  };
}

interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseQueryBuilder;
  insert: (data: unknown) => SupabaseQueryBuilder;
  update: (data: Record<string, unknown>) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder;
  in: (column: string, values: unknown[]) => SupabaseQueryBuilder;
  order: (column: string, options?: Record<string, unknown>) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: (callback: (result: { data: unknown; error: unknown }) => unknown) => Promise<unknown>;
}

const supabase = createClient(
  Deno.env.get('DATABASE_URL') || Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('DATABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Version that accepts an authenticated Supabase client
export async function createAndSetRfpWithClient(authenticatedSupabase: SupabaseClient, parameters: RFPFormData, sessionContext?: SessionContext): Promise<ToolResult> {
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
    const genericNames = ['New RFP', 'RFP', 'Untitled RFP', 'Draft RFP'];
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
    
    console.log('📝 Inserting RFP with authenticated client:', rfpData);
    
    // Insert RFP into database using authenticated client
    const { data: newRfp, error: insertError } = await authenticatedSupabase
      .from('rfps')
      .insert([rfpData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ RFP creation error:', insertError);
      const errorMessage = (insertError as { message?: string }).message || 'Unknown error';
      throw new Error(`Failed to create RFP: ${errorMessage}`);
    }
    
    console.log('✅ RFP created successfully:', newRfp);
    
    // Type cast newRfp for safe property access
    const rfpRecord = newRfp as Record<string, unknown>;
    
    // Update session to set current RFP if sessionId is provided
    if (sessionContext?.sessionId) {
      console.log('🔗 Setting current RFP in session:', sessionContext.sessionId);
      
      const { error: updateError } = await authenticatedSupabase
        .from('sessions')
        .update({ current_rfp_id: rfpRecord.id })
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
      data: rfpRecord,
      current_rfp_id: rfpRecord.id as number,
      rfp: undefined,
      message: `RFP "${String(rfpRecord.name || 'Untitled')}" created successfully with ID ${String(rfpRecord.id || '')}`,
      clientCallbacks: [
        {
          type: 'ui_refresh',
          target: 'rfp_context',
          payload: {
            rfp_id: rfpRecord.id as number,
            rfp_name: String(rfpRecord.name || 'Untitled'),
            rfp_data: rfpRecord,
            message: `RFP "${String(rfpRecord.name || 'Untitled')}" has been created successfully`
          },
          priority: 'high'
        }
      ]
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
export async function createAndSetRfp(parameters: RFPFormData, sessionContext?: SessionContext): Promise<ToolResult> {
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
    const genericNames = ['New RFP', 'RFP', 'Untitled RFP', 'Draft RFP'];
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