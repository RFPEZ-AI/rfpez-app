// Copyright Mark Skiba, 2025 All rights reserved
// Vendor List Tool Handler for Claude API v3
// Manages Vendor List artifacts with auto-save functionality

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface VendorSelectionVendor {
  id: string;
  name: string;
  selected: boolean;
  selectedAt?: string;
  metadata?: Record<string, unknown>;
}

interface VendorSelectionSchema {
  vendors: VendorSelectionVendor[];
  lastModified: string;
  autoSaveEnabled: boolean;
  metadata?: Record<string, unknown>;
}

interface ManageVendorSelectionParams {
  operation: 'create' | 'read' | 'update' | 'add_vendors' | 'remove_vendors' | 'toggle_selection';
  rfp_id: number;
  session_id: string;
  user_id: string;
  vendors?: VendorSelectionVendor[];
  vendor_ids?: string[];
  artifact_id?: string;
  name?: string;
  description?: string;
  // NOTE: account_id is fetched from session internally, not passed as parameter
}

// Type for artifact from join query
interface ArtifactJoinResult {
  id: string;
  name: string;
  description: string;
  type: string;
  artifact_role: string;
  schema: VendorSelectionSchema;
  updated_at: string;
  last_saved_at: string;
}

/**
 * Tool handler for managing Vendor List artifacts
 * This tool provides CRUD operations for Vendor Lists with auto-save
 */
export async function handleManageVendorSelection(
  supabase: SupabaseClient,
  params: ManageVendorSelectionParams
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  
  console.log('[VendorSelection] Operation:', params.operation, 'RFP:', params.rfp_id);

  try {
    switch (params.operation) {
      case 'create':
        return await createVendorSelection(supabase, params);
      
      case 'read':
        return await readVendorSelection(supabase, params);
      
      case 'update':
        return await updateVendorSelection(supabase, params);
      
      case 'add_vendors':
        return await addVendors(supabase, params);
      
      case 'remove_vendors':
        return await removeVendors(supabase, params);
      
      case 'toggle_selection':
        return await toggleVendorSelection(supabase, params);
      
      default:
        return {
          success: false,
          error: `Unknown operation: ${params.operation}`
        };
    }
  } catch (error) {
    console.error('[VendorSelection] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Create a new vendor selection artifact for an RFP
 * Only one vendor selection artifact is allowed per RFP
 */
async function createVendorSelection(
  supabase: SupabaseClient,
  params: ManageVendorSelectionParams
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  // 🔧 FIX: Parse vendors if it's a JSON string (Claude API serialization issue)
  if (params.vendors && typeof params.vendors === 'string') {
    try {
      params.vendors = JSON.parse(params.vendors as unknown as string);
      console.log('🔧 Parsed vendors from JSON string:', params.vendors);
    } catch (e) {
      console.error('❌ Error parsing vendors JSON:', e);
      throw new Error('Invalid vendors format: must be valid JSON array');
    }
  }

  // ✅ CRITICAL FIX: Get account_id from session (artifacts table requires it)
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('account_id')
    .eq('id', params.session_id)
    .single() as { data: { account_id: string } | null; error: Error | null };

  if (sessionError || !sessionData?.account_id) {
    throw new Error(`❌ Could not get account_id from session ${params.session_id}. Session may not exist or lacks account association.`);
  }

  const accountId = sessionData.account_id;
  console.log('✅ Retrieved account_id from session:', accountId);

  // Fetch RFP name to include in vendor selection title
  const { data: rfpData } = await supabase
    .from('rfps')
    .select('name')
    .eq('id', params.rfp_id)
    .single() as { data: { name: string } | null; error: Error | null };

  const rfpName = rfpData?.name || 'Unknown RFP';
  console.log('✅ Retrieved RFP name:', rfpName);

  // Check if vendor selection already exists for this RFP
  const { data: existing, error: checkError } = await supabase
    .from('rfp_artifacts')
    .select(`
      artifact_id,
      artifacts!inner(id, name, type, artifact_role)
    `)
    .eq('rfp_id', params.rfp_id)
    .eq('artifacts.type', 'vendor_selection')
    .eq('artifacts.artifact_role', 'vendor_selection_form')
    .single();

  if (existing && !checkError) {
    return {
      success: false,
      error: 'Vendor selection artifact already exists for this RFP',
      data: { artifact_id: existing.artifact_id }
    };
  }

  // Create new vendor selection artifact
  const initialSchema: VendorSelectionSchema = {
    vendors: params.vendors || [],
    lastModified: new Date().toISOString(),
    autoSaveEnabled: true
  };

  const artifactData = {
    id: crypto.randomUUID(),
    name: params.name || `Vendor List - ${rfpName}`,
    description: params.description || 'Vendor list for this RFP (select vendors to invite)',
    type: 'vendor_selection',
    artifact_role: 'vendor_selection_form',
    schema: initialSchema,
    session_id: params.session_id,
    account_id: accountId, // ✅ Use account_id from session, not params
    user_id: params.user_id,
    status: 'active',
    processing_status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: artifact, error: artifactError } = await supabase
    .from('artifacts')
    .insert(artifactData)
    .select()
    .single();

  if (artifactError) {
    console.error('[VendorSelection] Create artifact error:', artifactError);
    return {
      success: false,
      error: `Failed to create vendor selection artifact: ${artifactError.message}`
    };
  }

  // Link artifact to RFP
  const { error: linkError } = await supabase
    .from('rfp_artifacts')
    .insert({
      rfp_id: params.rfp_id,
      artifact_id: artifact.id,
      role: 'buyer', // ✅ Vendor selection is a buyer role artifact
      created_at: new Date().toISOString()
    });

  if (linkError) {
    console.error('[VendorSelection] Link to RFP error:', linkError);
    // Try to clean up the artifact
    await supabase.from('artifacts').delete().eq('id', artifact.id);
    return {
      success: false,
      error: `Failed to link vendor selection to RFP: ${linkError.message}`
    };
  }

  // 🔗 CRITICAL FIX: Link artifact to session via session_artifacts junction table
  // This is required for the UI to display artifacts in the artifact panel
  try {
    console.log('[VendorSelection] Linking artifact to session:', {
      sessionId: params.session_id,
      artifactId: artifact.id,
      accountId
    });
    
    const { error: sessionLinkError } = await supabase
      .from('session_artifacts')
      .insert({
        session_id: params.session_id,
        artifact_id: artifact.id,
        account_id: accountId
      });
    
    if (sessionLinkError) {
      console.error('[VendorSelection] Failed to link artifact to session:', sessionLinkError);
      // Don't throw - artifact was created successfully, this is just UI linkage
    } else {
      console.log('[VendorSelection] Successfully linked artifact to session');
    }
  } catch (sessionLinkingError) {
    console.error('[VendorSelection] Error during session-artifact linking:', sessionLinkingError);
    // Continue - artifact exists, just UI might not show it immediately
  }

  return {
    success: true,
    data: {
      artifact_id: artifact.id,
      artifact_name: artifact.name,
      vendor_count: initialSchema.vendors.length,
      schema: initialSchema
    },
    message: 'Vendor selection artifact created successfully'
  };
}

/**
 * Read vendor selection artifact for an RFP
 */
async function readVendorSelection(
  supabase: SupabaseClient,
  params: ManageVendorSelectionParams
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Find vendor selection artifact for this RFP
  const { data: rfpArtifact, error: findError } = await supabase
    .from('rfp_artifacts')
    .select(`
      artifact_id,
      artifacts!inner(
        id,
        name,
        description,
        type,
        artifact_role,
        schema,
        updated_at,
        last_saved_at
      )
    `)
    .eq('rfp_id', params.rfp_id)
    .eq('artifacts.type', 'vendor_selection')
    .eq('artifacts.artifact_role', 'vendor_selection_form')
    .single();

  if (findError || !rfpArtifact) {
    return {
      success: false,
      error: 'No vendor selection artifact found for this RFP'
    };
  }

  const artifact = (Array.isArray(rfpArtifact.artifacts) ? rfpArtifact.artifacts[0] : rfpArtifact.artifacts) as ArtifactJoinResult;
  const schema = artifact.schema as VendorSelectionSchema;

  return {
    success: true,
    data: {
      artifact_id: artifact.id,
      name: artifact.name,
      description: artifact.description,
      vendors: schema.vendors,
      selected_count: schema.vendors.filter(v => v.selected).length,
      total_count: schema.vendors.length,
      last_modified: schema.lastModified,
      auto_save_enabled: schema.autoSaveEnabled,
      updated_at: artifact.updated_at,
      last_saved_at: artifact.last_saved_at
    }
  };
}

/**
 * Update vendor selection artifact (replace entire vendor list)
 */
async function updateVendorSelection(
  supabase: SupabaseClient,
  params: ManageVendorSelectionParams
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  // 🔧 FIX: Parse vendors if it's a JSON string (Claude API serialization issue)
  if (params.vendors && typeof params.vendors === 'string') {
    try {
      params.vendors = JSON.parse(params.vendors as unknown as string);
      console.log('🔧 [updateVendorSelection] Parsed vendors from JSON string');
    } catch (e) {
      console.error('❌ [updateVendorSelection] Error parsing vendors JSON:', e);
      return {
        success: false,
        error: 'Invalid vendors format: must be valid JSON array'
      };
    }
  }

  if (!params.vendors) {
    return {
      success: false,
      error: 'Vendors array is required for update operation'
    };
  }

  // Find artifact
  const { data: rfpArtifact, error: findError } = await supabase
    .from('rfp_artifacts')
    .select(`
      artifact_id,
      artifacts!inner(id, schema)
    `)
    .eq('rfp_id', params.rfp_id)
    .eq('artifacts.type', 'vendor_selection')
    .single();

  if (findError || !rfpArtifact) {
    return {
      success: false,
      error: 'Vendor selection artifact not found'
    };
  }

  const artifact = (Array.isArray(rfpArtifact.artifacts) ? rfpArtifact.artifacts[0] : rfpArtifact.artifacts) as ArtifactJoinResult;
  const currentSchema = artifact.schema as VendorSelectionSchema;

  // Update schema with new vendors
  const updatedSchema: VendorSelectionSchema = {
    ...currentSchema,
    vendors: params.vendors,
    lastModified: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('artifacts')
    .update({
      schema: updatedSchema,
      updated_at: new Date().toISOString(),
      last_saved_at: new Date().toISOString()
    })
    .eq('id', artifact.id);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update vendor selection: ${updateError.message}`
    };
  }

  return {
    success: true,
    data: {
      artifact_id: artifact.id,
      vendor_count: updatedSchema.vendors.length,
      selected_count: updatedSchema.vendors.filter(v => v.selected).length,
      last_modified: updatedSchema.lastModified
    },
    message: 'Vendor selection updated successfully'
  };
}

/**
 * Add vendors to existing vendor selection
 */
async function addVendors(
  supabase: SupabaseClient,
  params: ManageVendorSelectionParams
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  // 🔧 FIX: Parse vendors if it's a JSON string (Claude API serialization issue)
  if (params.vendors && typeof params.vendors === 'string') {
    try {
      params.vendors = JSON.parse(params.vendors as unknown as string);
      console.log('🔧 [addVendors] Parsed vendors from JSON string');
    } catch (e) {
      console.error('❌ [addVendors] Error parsing vendors JSON:', e);
      return {
        success: false,
        error: 'Invalid vendors format: must be valid JSON array'
      };
    }
  }

  if (!params.vendors || params.vendors.length === 0) {
    return {
      success: false,
      error: 'At least one vendor is required'
    };
  }

  // Find artifact
  const { data: rfpArtifact, error: findError } = await supabase
    .from('rfp_artifacts')
    .select(`
      artifact_id,
      artifacts!inner(id, schema)
    `)
    .eq('rfp_id', params.rfp_id)
    .eq('artifacts.type', 'vendor_selection')
    .single();

  if (findError || !rfpArtifact) {
    return {
      success: false,
      error: 'Vendor selection artifact not found'
    };
  }

  const artifact = (Array.isArray(rfpArtifact.artifacts) ? rfpArtifact.artifacts[0] : rfpArtifact.artifacts) as ArtifactJoinResult;
  const currentSchema = artifact.schema as VendorSelectionSchema;

  // Add new vendors (avoid duplicates by ID)
  const existingIds = new Set(currentSchema.vendors.map(v => v.id));
  const newVendors = params.vendors.filter(v => !existingIds.has(v.id));

  if (newVendors.length === 0) {
    return {
      success: false,
      error: 'All vendors already exist in the selection'
    };
  }

  const updatedSchema: VendorSelectionSchema = {
    ...currentSchema,
    vendors: [...currentSchema.vendors, ...newVendors],
    lastModified: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('artifacts')
    .update({
      schema: updatedSchema,
      updated_at: new Date().toISOString(),
      last_saved_at: new Date().toISOString()
    })
    .eq('id', artifact.id);

  if (updateError) {
    return {
      success: false,
      error: `Failed to add vendors: ${updateError.message}`
    };
  }

  return {
    success: true,
    data: {
      artifact_id: artifact.id,
      added_count: newVendors.length,
      total_count: updatedSchema.vendors.length
    },
    message: `Added ${newVendors.length} vendor(s) successfully`
  };
}

/**
 * Remove vendors from vendor selection
 */
async function removeVendors(
  supabase: SupabaseClient,
  params: ManageVendorSelectionParams
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  if (!params.vendor_ids || params.vendor_ids.length === 0) {
    return {
      success: false,
      error: 'At least one vendor ID is required'
    };
  }

  // Find artifact
  const { data: rfpArtifact, error: findError } = await supabase
    .from('rfp_artifacts')
    .select(`
      artifact_id,
      artifacts!inner(id, schema)
    `)
    .eq('rfp_id', params.rfp_id)
    .eq('artifacts.type', 'vendor_selection')
    .single();

  if (findError || !rfpArtifact) {
    return {
      success: false,
      error: 'Vendor selection artifact not found'
    };
  }

  const artifact = (Array.isArray(rfpArtifact.artifacts) ? rfpArtifact.artifacts[0] : rfpArtifact.artifacts) as ArtifactJoinResult;
  const currentSchema = artifact.schema as VendorSelectionSchema;

  // Remove vendors by ID
  const idsToRemove = new Set(params.vendor_ids);
  const remainingVendors = currentSchema.vendors.filter(v => !idsToRemove.has(v.id));

  if (remainingVendors.length === currentSchema.vendors.length) {
    return {
      success: false,
      error: 'No vendors were removed (IDs not found)'
    };
  }

  const updatedSchema: VendorSelectionSchema = {
    ...currentSchema,
    vendors: remainingVendors,
    lastModified: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('artifacts')
    .update({
      schema: updatedSchema,
      updated_at: new Date().toISOString(),
      last_saved_at: new Date().toISOString()
    })
    .eq('id', artifact.id);

  if (updateError) {
    return {
      success: false,
      error: `Failed to remove vendors: ${updateError.message}`
    };
  }

  const removedCount = currentSchema.vendors.length - remainingVendors.length;

  return {
    success: true,
    data: {
      artifact_id: artifact.id,
      removed_count: removedCount,
      remaining_count: remainingVendors.length
    },
    message: `Removed ${removedCount} vendor(s) successfully`
  };
}

/**
 * Toggle vendor selection status (select/deselect)
 */
async function toggleVendorSelection(
  supabase: SupabaseClient,
  params: ManageVendorSelectionParams
): Promise<{ success: boolean; data?: unknown; error?: string; message?: string }> {
  if (!params.vendor_ids || params.vendor_ids.length === 0) {
    return {
      success: false,
      error: 'At least one vendor ID is required'
    };
  }

  // Find artifact
  const { data: rfpArtifact, error: findError } = await supabase
    .from('rfp_artifacts')
    .select(`
      artifact_id,
      artifacts!inner(id, schema)
    `)
    .eq('rfp_id', params.rfp_id)
    .eq('artifacts.type', 'vendor_selection')
    .single();

  if (findError || !rfpArtifact) {
    return {
      success: false,
      error: 'Vendor selection artifact not found'
    };
  }

  const artifact = (Array.isArray(rfpArtifact.artifacts) ? rfpArtifact.artifacts[0] : rfpArtifact.artifacts) as ArtifactJoinResult;
  const currentSchema = artifact.schema as VendorSelectionSchema;

  // Toggle selection for specified vendors
  const idsToToggle = new Set(params.vendor_ids);
  const now = new Date().toISOString();
  let toggledCount = 0;

  const updatedVendors = currentSchema.vendors.map(vendor => {
    if (idsToToggle.has(vendor.id)) {
      toggledCount++;
      return {
        ...vendor,
        selected: !vendor.selected,
        selectedAt: !vendor.selected ? now : undefined
      };
    }
    return vendor;
  });

  if (toggledCount === 0) {
    return {
      success: false,
      error: 'No vendors were toggled (IDs not found)'
    };
  }

  const updatedSchema: VendorSelectionSchema = {
    ...currentSchema,
    vendors: updatedVendors,
    lastModified: now
  };

  const { error: updateError } = await supabase
    .from('artifacts')
    .update({
      schema: updatedSchema,
      updated_at: now,
      last_saved_at: now
    })
    .eq('id', artifact.id);

  if (updateError) {
    return {
      success: false,
      error: `Failed to toggle vendor selection: ${updateError.message}`
    };
  }

  const selectedCount = updatedVendors.filter(v => v.selected).length;

  return {
    success: true,
    data: {
      artifact_id: artifact.id,
      toggled_count: toggledCount,
      selected_count: selectedCount,
      total_count: updatedVendors.length,
      last_modified: now
    },
    message: `Toggled ${toggledCount} vendor(s) successfully`
  };
}
