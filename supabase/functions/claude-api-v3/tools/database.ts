// Copyright Mark Skiba, 2025 All rights reserved
// Core tools and database operations for Claude API v3
import { mapArtifactRole } from '../utils/mapping.ts';
// Transform custom form structure to standard JSON Schema
function transformToJsonSchema(customForm) {
  // Check if it's already a valid JSON Schema
  if (customForm.type === 'object' && customForm.properties) {
    return {
      schema: customForm,
      uiSchema: {},
      defaultValues: {}
    };
  }
  // Check if it's our custom sections/fields structure
  if (customForm.sections && Array.isArray(customForm.sections)) {
    const properties = {};
    const required = [];
    const uiSchema = {};
    const defaultValues = {};
    // Process each section
    customForm.sections.forEach((section)=>{
      if (section.fields && Array.isArray(section.fields)) {
        section.fields.forEach((field)=>{
          const fieldId = field.id || field.name;
          if (!fieldId || typeof fieldId !== 'string') {
            console.warn('Skipping field with invalid or missing id/name:', field);
            return;
          }
          // Convert field to JSON Schema property
          const property = {
            title: field.label || fieldId,
            description: field.placeholder || field.description
          };
          // Normalize field type to prevent undefined types
          const fieldType = field.type || 'text';
          console.log(`Processing field: ${fieldId}, type: ${fieldType}`);
          // Map field types to JSON Schema types
          switch(fieldType){
            case 'text':
            case 'email':
            case 'tel':
              property.type = 'string';
              if (field.type === 'email') property.format = 'email';
              break;
            case 'textarea':
              property.type = 'string';
              uiSchema[fieldId] = {
                'ui:widget': 'textarea'
              };
              break;
            case 'number':
              property.type = 'number';
              if (typeof field.min === 'number') property.minimum = field.min;
              if (typeof field.max === 'number') property.maximum = field.max;
              break;
            case 'checkbox':
              if (field.options && Array.isArray(field.options)) {
                property.type = 'array';
                // Handle both simple strings and objects with value property
                const enumValues = field.options.length > 0 && typeof field.options[0] === 'object' && field.options[0]?.value ? field.options.map((opt)=>opt.value) : field.options;
                property.items = {
                  type: 'string',
                  enum: enumValues
                };
                property.uniqueItems = true;
                uiSchema[fieldId] = {
                  'ui:widget': 'checkboxes'
                };
              } else {
                property.type = 'boolean';
              }
              break;
            case 'radio':
              {
                property.type = 'string';
                // Handle both simple strings and objects with value property
                const radioEnumValues = Array.isArray(field.options) && field.options.length > 0 && typeof field.options[0] === 'object' && field.options[0]?.value ? field.options.map((opt)=>opt.value) : field.options || [];
                property.enum = radioEnumValues;
                uiSchema[fieldId] = {
                  'ui:widget': 'radio'
                };
                break;
              }
            case 'select':
              {
                property.type = 'string';
                // Handle both simple strings and objects with value property
                const selectEnumValues = Array.isArray(field.options) && field.options.length > 0 && typeof field.options[0] === 'object' && field.options[0]?.value ? field.options.map((opt)=>opt.value) : field.options || [];
                property.enum = selectEnumValues;
                break;
              }
            default:
              console.warn(`Unknown field type "${fieldType}" for field "${fieldId}", defaulting to string`);
              property.type = 'string';
          }
          // Ensure every property has a valid type
          if (!property.type) {
            console.warn(`Field "${fieldId}" missing type after processing, defaulting to string`);
            property.type = 'string';
          }
          properties[fieldId] = property;
          // Add to required if field is required
          if (field.required === true) {
            required.push(fieldId);
          }
          // Set default value if provided
          if (field.default !== undefined) {
            defaultValues[fieldId] = field.default;
          }
        });
      }
    });
    const schema = {
      type: 'object',
      title: customForm.title || 'Form',
      description: customForm.description,
      properties,
      required: required.length > 0 ? required : undefined
    };
    // Validate schema properties to prevent "Unknown field type undefined" errors
    Object.entries(properties).forEach(([key, prop])=>{
      const property = prop;
      if (!property.type) {
        console.error(`Property "${key}" has no type, fixing to string`);
        property.type = 'string';
      }
    });
    console.log('Generated schema with properties:', Object.keys(properties).map((key)=>{
      const prop = properties[key];
      return `${key}:${prop.type}`;
    }).join(', '));
    return {
      schema,
      uiSchema,
      defaultValues
    };
  }
  // Fallback: treat as direct schema
  return {
    schema: customForm,
    uiSchema: {},
    defaultValues: {}
  };
}
// Get the current active RFP for a session
export async function getCurrentRfp(supabase, sessionId) {
  console.log('🔍 Getting current RFP for session:', sessionId);
  const { data: session, error: sessionError } = await supabase.from('sessions').select('current_rfp_id').eq('id', sessionId).single();
  if (sessionError) {
    console.error('Error fetching session:', sessionError);
    throw new Error(`Failed to fetch session: ${sessionError.message}`);
  }
  if (!session?.current_rfp_id) {
    console.log('⚠️ No current RFP set for this session');
    return {
      success: true,
      rfp_id: null,
      message: 'No RFP is currently set for this session. Call create_and_set_rfp to create a new RFP first.'
    };
  }
  // Fetch RFP details
  const { data: rfp, error: rfpError } = await supabase.from('rfps').select('id, name, description, status, created_at').eq('id', session.current_rfp_id).single();
  if (rfpError) {
    console.error('Error fetching RFP:', rfpError);
    throw new Error(`Failed to fetch RFP: ${rfpError.message}`);
  }
  if (!rfp) {
    throw new Error('RFP not found');
  }
  console.log('✅ Found current RFP:', {
    id: rfp.id,
    name: rfp.name
  });
  return {
    success: true,
    rfp_id: rfp.id,
    name: rfp.name,
    description: rfp.description,
    status: rfp.status,
    created_at: rfp.created_at,
    message: `Current RFP: ${rfp.name} (ID: ${rfp.id})`
  };
}
/**
 * Set an existing RFP as the current active RFP for a session
 * Allows switching between existing RFPs without creating new ones
 */ export async function setCurrentRfp(supabase, sessionId, rfpId, rfpName) {
  console.log('🔄 Setting current RFP for session:', {
    sessionId,
    rfpId,
    rfpName
  });
  // Must provide either rfp_id or rfp_name
  if (!rfpId && !rfpName) {
    throw new Error('Either rfp_id or rfp_name must be provided');
  }
  let targetRfpId = rfpId;
  // If searching by name, find the RFP first
  if (!targetRfpId && rfpName) {
    console.log('🔍 Searching for RFP by name:', rfpName);
    const { data: rfps, error: searchError } = await supabase.from('rfps').select('id, name').ilike('name', `%${rfpName}%`).order('created_at', {
      ascending: false
    }).limit(5);
    if (searchError) {
      console.error('Error searching for RFP:', searchError);
      throw new Error(`Failed to search for RFP: ${searchError.message}`);
    }
    if (!rfps || rfps.length === 0) {
      throw new Error(`No RFP found matching name: ${rfpName}`);
    }
    if (rfps.length > 1) {
      const rfpList = rfps.map((r)=>`"${r.name}" (ID: ${r.id})`).join(', ');
      console.log(`⚠️ Multiple RFPs found matching "${rfpName}": ${rfpList}`);
      // Use the most recent one
      targetRfpId = rfps[0].id;
      console.log(`Using most recent: ${rfps[0].name} (ID: ${targetRfpId})`);
    } else {
      targetRfpId = rfps[0].id;
      console.log(`✅ Found RFP: ${rfps[0].name} (ID: ${targetRfpId})`);
    }
  }
  // Verify the RFP exists
  const { data: rfp, error: rfpError } = await supabase.from('rfps').select('id, name, description, status').eq('id', targetRfpId).single();
  if (rfpError || !rfp) {
    console.error('RFP not found:', {
      targetRfpId,
      error: rfpError
    });
    throw new Error(`RFP with ID ${targetRfpId} not found`);
  }
  // Update the session's current_rfp_id
  const { error: updateError } = await supabase.from('sessions').update({
    current_rfp_id: targetRfpId
  }).eq('id', sessionId);
  if (updateError) {
    console.error('Error updating session:', updateError);
    throw new Error(`Failed to set current RFP: ${typeof updateError === 'object' && updateError && 'message' in updateError ? String(updateError.message) : 'Unknown error'}`);
  }
  console.log('✅ Successfully set current RFP:', {
    sessionId,
    rfpId: rfp.id,
    rfpName: rfp.name
  });
  return {
    success: true,
    rfp_id: rfp.id,
    name: rfp.name,
    description: rfp.description,
    status: rfp.status,
    message: `Switched to RFP: ${rfp.name} (ID: ${rfp.id})`
  };
}
// Create a form artifact in the database
export async function createFormArtifact(supabase, sessionId, userId, data) {
  const { name, description, content, artifactRole, rfp_id } = data;
  // ⚠️ CRITICAL: Validate RFP ID is provided (automatically injected by executeTool)
  if (!rfp_id) {
    throw new Error('❌ CRITICAL: rfp_id is required but was not auto-injected. This indicates a system error - the current RFP should be automatically retrieved from the session.');
  }
  // Validate RFP exists
  console.log('🔍 Validating RFP access for rfp_id:', rfp_id);
  // First check if we have auth context
  const { data: authCheck } = await supabase.rpc('auth.uid');
  console.log('🔐 Current auth.uid() value:', authCheck);
  const { data: rfp, error: rfpError } = await supabase.from('rfps').select('id, name, account_id, is_public').eq('id', rfp_id).single();
  if (rfpError || !rfp) {
    console.error('❌ RFP validation failed:', {
      rfp_id,
      error: rfpError,
      rfp
    });
    throw new Error(`❌ Invalid RFP ID: ${rfp_id}. The specified RFP does not exist. Use get_current_rfp or create_and_set_rfp to get a valid RFP ID.`);
  }
  console.log('✅ Validated RFP association:', {
    rfp_id,
    rfp_name: rfp.name,
    account_id: rfp.account_id,
    is_public: rfp.is_public
  });
  // ✅ CRITICAL FIX: Get account_id from session (artifacts table requires it)
  const { data: sessionData, error: sessionError } = await supabase.from('sessions').select('account_id').eq('id', sessionId).single();
  if (sessionError || !sessionData?.account_id) {
    throw new Error(`❌ Could not get account_id from session ${sessionId}. Session may not exist or lacks account association.`);
  }
  const accountId = sessionData.account_id;
  console.log('✅ Retrieved account_id from session:', accountId);
  // Default to buyer_questionnaire if artifactRole is not provided
  const effectiveArtifactRole = artifactRole || 'buyer_questionnaire';
  // Map artifact role to valid database value
  const mappedRole = mapArtifactRole(effectiveArtifactRole);
  if (!mappedRole) {
    throw new Error(`Invalid artifact role: ${effectiveArtifactRole}`);
  }
  // Generate a unique ID for the artifact (artifacts table uses text ID)
  const artifactId = crypto.randomUUID();
  console.log('Creating form artifact:', {
    artifactId,
    name,
    description,
    artifactRole: effectiveArtifactRole,
    mappedRole,
    sessionId,
    userId,
    accountId
  });
  // Parse the content to extract schema components
  let schema = {};
  let ui_schema = {};
  let default_values = {};
  let submit_action = {
    type: 'save_session'
  };
  if (content && typeof content === 'object') {
    const contentObj = content;
    // If content already has the expected structure
    if (contentObj.schema) {
      schema = contentObj.schema;
      ui_schema = contentObj.uiSchema || contentObj.ui_schema || {};
      default_values = contentObj.formData || contentObj.default_values || {};
      submit_action = contentObj.submitAction || contentObj.submit_action || {
        type: 'save_session'
      };
    } else {
      // Transform any custom structure to JSON Schema
      const transformed = transformToJsonSchema(contentObj);
      schema = transformed.schema;
      ui_schema = transformed.uiSchema;
      default_values = transformed.defaultValues;
      submit_action = {
        type: 'save_session'
      };
    }
  }
  // Validate schema structure to prevent frontend errors
  if (schema && typeof schema === 'object' && schema.properties) {
    const properties = schema.properties;
    Object.entries(properties).forEach(([key, prop])=>{
      const property = prop;
      if (!property.type) {
        console.warn(`Schema property "${key}" missing type, defaulting to string`);
        property.type = 'string';
      }
    });
  }
  console.log('Parsed form components:', {
    hasSchema: !!schema && Object.keys(schema).length > 0,
    hasUiSchema: !!ui_schema && Object.keys(ui_schema).length > 0,
    hasDefaultValues: !!default_values && Object.keys(default_values).length > 0,
    schemaType: schema?.type,
    propertyCount: schema && schema.properties ? Object.keys(schema.properties).length : 0
  });
  const { data: artifact, error } = await supabase.from('artifacts').insert({
    id: artifactId,
    session_id: sessionId,
    user_id: userId,
    account_id: accountId,
    name: name,
    description: description,
    artifact_role: mappedRole,
    schema: schema,
    ui_schema: ui_schema,
    default_values: default_values,
    submit_action: submit_action,
    type: 'form',
    status: 'active',
    processing_status: 'completed',
    created_at: new Date().toISOString()
  }).select().single();
  if (error) {
    console.error('Error creating form artifact:', error);
    throw error;
  }
  console.log('✅ Form artifact successfully inserted into database:', artifact.id);
  // Add explicit wait to ensure database commit completes
  await new Promise((resolve)=>setTimeout(resolve, 100));
  // ARTIFACT-RFP LINKING: Link form artifact to the provided RFP with UPSERT logic
  try {
    console.log('🔗 Claude API V3: Linking form artifact to RFP (with upsert):', {
      artifactId: artifact.id,
      rfpId: rfp_id,
      artifactRole: mappedRole
    });
    // Map artifact role to valid rfp_artifacts role values
    let rfpRole = 'supplier'; // Default
    if (mappedRole?.includes('buyer') || mappedRole?.includes('questionnaire')) {
      rfpRole = 'buyer';
    } else if (mappedRole?.includes('supplier') || mappedRole?.includes('bid')) {
      rfpRole = 'supplier';
    } else if (mappedRole?.includes('evaluator')) {
      rfpRole = 'evaluator';
    }
    // 🎯 UPSERT LOGIC: Check if artifact_role already exists for this RFP
    // NOTE: This checks for EXACT role match only. Different forms can have suffixes if needed.
    if (mappedRole) {
      const { data: existingLink, error: checkError } = await supabase.from('rfp_artifacts').select('artifact_id, artifact_role, artifacts!inner(id, name)').eq('rfp_id', rfp_id).eq('artifact_role', mappedRole).maybeSingle();
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('⚠️ Error checking for existing artifact_role:', checkError);
      } else if (existingLink) {
        const existingArtifactId = existingLink.artifact_id;
        const existingArtifactName = existingLink.artifacts.name;
        console.log(`🔄 Form with role "${mappedRole}" already exists for RFP ${rfp_id}. Updating existing artifact: ${existingArtifactId}`);
        // Update the existing artifact with new content
        const { error: updateError } = await supabase.from('artifacts').update({
          name,
          description,
          schema,
          ui_schema,
          default_values,
          submit_action,
          updated_at: new Date().toISOString()
        }).eq('id', existingArtifactId);
        if (updateError) {
          console.error('❌ Failed to update existing form artifact:', updateError);
          throw new Error(`Failed to update existing form artifact with role "${mappedRole}": ${JSON.stringify(updateError)}`);
        }
        console.log(`✅ Successfully updated existing form artifact: "${existingArtifactName}" (${existingArtifactId})`);
        return {
          success: true,
          artifact_id: existingArtifactId,
          artifact_name: existingArtifactName,
          message: `Updated existing form with role "${mappedRole}": ${existingArtifactName}`,
          is_update: true,
          artifact_role: mappedRole
        };
      }
    }
    // No existing artifact found - create new link
    console.log('📝 No existing form with this role found - creating new artifact link');
    // Insert into rfp_artifacts junction table
    const { error: linkError } = await supabase.from('rfp_artifacts').insert({
      rfp_id: rfp_id,
      artifact_id: artifact.id,
      role: rfpRole,
      artifact_role: mappedRole // Include artifact_role for unique constraint
    });
    if (linkError) {
      console.error('⚠️ Claude API V3: Failed to link artifact to RFP:', linkError);
      // Enhanced error message for unique constraint violations
      const errorDetails = linkError;
      if (errorDetails.code === '23505' || errorDetails.message?.includes('unique') || errorDetails.message?.includes('duplicate')) {
        throw new Error(`❌ DUPLICATE ROLE ERROR: An artifact with role "${mappedRole}" was just created by another process for RFP ${rfp_id}. This is a race condition. Please retry your request - the system will update the existing artifact. Database error: ${JSON.stringify(linkError)}`);
      }
      throw new Error(`Failed to link form artifact to RFP: ${JSON.stringify(linkError)}`);
    }
    console.log('✅ Claude API V3: Successfully linked artifact to RFP');
  } catch (linkingError) {
    console.error('⚠️ Claude API V3: Error during artifact linking:', linkingError);
    throw linkingError;
  }
  // ✅ Artifact already linked to session via session_id column in artifacts table
  // No need for redundant session_artifacts junction table insert
  const createdArtifactId = artifact.id;
  console.log('✅ Form artifact created and linked:', {
    artifactId: createdArtifactId,
    sessionId,
    rfpId: rfp_id
  });
  // Verify the artifact was actually saved by querying it back
  const { data: verification, error: verifyError } = await supabase.from('artifacts').select('id, name, type').eq('id', createdArtifactId).single();
  if (verifyError || !verification) {
    console.error('⚠️ Form artifact verification failed:', verifyError);
    throw new Error(`Failed to verify artifact creation: ${typeof verifyError === 'object' && verifyError && 'message' in verifyError ? String(verifyError.message) : 'Artifact not found after creation'}`);
  }
  console.log('✅ Form artifact creation verified:', verification);
  return {
    success: true,
    artifact_id: createdArtifactId,
    artifact_name: name,
    message: `Created ${mappedRole} artifact: ${name}`,
    clientCallbacks: [
      {
        type: 'ui_refresh',
        target: 'artifact_panel',
        payload: {
          artifact_id: createdArtifactId,
          artifact_name: name,
          artifact_type: 'form',
          artifact_role: mappedRole,
          message: `Form artifact "${name}" has been created successfully`
        },
        priority: 'medium'
      }
    ]
  };
}
// Create a document artifact and store in the database
export async function createDocumentArtifact(supabase, sessionId, userId, data) {
  console.log('🔥 CREATEDOCUMENTARTIFACT FUNCTION CALLED!', {
    sessionId,
    userId,
    data: JSON.stringify(data, null, 2)
  });
  const { rfp_id, name, description, content, content_type = 'markdown', artifactRole, tags = [] } = data;
  // ⚠️ CRITICAL: Validate RFP ID is provided (automatically injected by executeTool)
  if (!rfp_id) {
    throw new Error('❌ CRITICAL: rfp_id is required but was not auto-injected. This indicates a system error - the current RFP should be automatically retrieved from the session.');
  }
  // Validate RFP exists
  const { data: rfp, error: rfpError } = await supabase.from('rfps').select('id, name').eq('id', rfp_id).single();
  if (rfpError || !rfp) {
    throw new Error(`❌ Invalid RFP ID: ${rfp_id}. The specified RFP does not exist or has been deleted.`);
  }
  console.log('✅ Validated RFP association:', {
    rfp_id,
    rfp_name: rfp.name
  });
  // ✅ CRITICAL FIX: Get account_id from session (artifacts table requires it)
  const { data: sessionData, error: sessionError } = await supabase.from('sessions').select('account_id').eq('id', sessionId).single();
  if (sessionError || !sessionData?.account_id) {
    throw new Error(`❌ Could not get account_id from session ${sessionId}. Session may not exist or lacks account association.`);
  }
  const accountId = sessionData.account_id;
  console.log('✅ Retrieved account_id from session:', accountId);
  // Map artifact role to valid database value
  const mappedRole = mapArtifactRole(artifactRole);
  if (!mappedRole) {
    throw new Error(`Invalid artifact role: ${artifactRole}`);
  }
  // Generate a unique ID for the artifact (artifacts table uses text ID)
  const artifactId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('Creating document artifact:', {
    artifactId,
    name,
    description,
    artifactRole,
    mappedRole,
    sessionId,
    userId,
    accountId
  });
  // Validate content_type
  const validContentTypes = [
    'markdown',
    'plain',
    'html'
  ];
  if (!validContentTypes.includes(content_type)) {
    throw new Error(`Content type must be one of: ${validContentTypes.join(', ')}`);
  }
  // 🎯 UPSERT LOGIC: For rfp_request_email, check if one already exists and update it
  if (mappedRole === 'rfp_request_email') {
    console.log('🔍 Checking for existing rfp_request_email for RFP:', rfp_id);
    const { data: existingArtifacts, error: searchError } = await supabase.from('rfp_artifacts').select('artifact_id, artifacts!inner(id, name, artifact_role)').eq('rfp_id', rfp_id).eq('artifacts.artifact_role', 'rfp_request_email').limit(1);
    if (searchError) {
      console.error('❌ Error searching for existing rfp_request_email:', searchError);
    // Continue with creation if search fails
    } else if (existingArtifacts && Array.isArray(existingArtifacts) && existingArtifacts.length > 0) {
      const existingArtifactId = existingArtifacts[0].artifact_id;
      console.log('✅ Found existing rfp_request_email:', existingArtifactId, '- updating instead of creating');
      // Update the existing artifact
      const { error: updateError } = await supabase.from('artifacts').update({
        name,
        description,
        default_values: {
          content,
          content_type,
          tags
        },
        processed_content: content,
        file_size: content.length,
        mime_type: content_type === 'html' ? 'text/html' : content_type === 'plain' ? 'text/plain' : 'text/markdown',
        metadata: {
          type: 'text',
          content_type,
          description: description || null,
          tags: tags || [],
          user_id: userId,
          updated_reason: 'Regenerated RFP request email'
        },
        updated_at: new Date().toISOString()
      }).eq('id', existingArtifactId).select().single();
      if (updateError) {
        console.error('❌ Error updating existing rfp_request_email:', updateError);
        throw updateError;
      }
      console.log('✅ Successfully updated existing rfp_request_email:', existingArtifactId);
      return {
        success: true,
        artifact_id: existingArtifactId,
        artifact_name: name,
        message: `Updated existing RFP request email: ${name}`,
        is_update: true
      };
    }
    console.log('📝 No existing rfp_request_email found - creating new one');
  }
  const insertData = {
    id: artifactId,
    session_id: sessionId,
    user_id: userId,
    account_id: accountId,
    name: name,
    description: description,
    artifact_role: mappedRole,
    schema: {
      type: 'text',
      content_type,
      tags: tags || []
    },
    ui_schema: null,
    default_values: {
      content,
      content_type,
      tags: tags || []
    },
    submit_action: null,
    type: 'document',
    status: 'active',
    processing_status: 'completed',
    file_size: content.length,
    mime_type: content_type === 'html' ? 'text/html' : content_type === 'plain' ? 'text/plain' : 'text/markdown',
    processed_content: content,
    metadata: {
      type: 'text',
      content_type,
      description: description || null,
      tags: tags || [],
      user_id: userId
    },
    created_at: new Date().toISOString()
  };
  console.log('🗄️ Document artifact insert data:', JSON.stringify(insertData, null, 2));
  const { data: artifact, error } = await supabase.from('artifacts').insert(insertData).select().single();
  console.log('🗄️ Document artifact insert result:', {
    success: !error,
    error: error ? JSON.stringify(error, null, 2) : null,
    artifact: artifact ? {
      id: artifact.id,
      name: artifact.name
    } : null
  });
  if (error) {
    console.error('❌ Error creating document artifact:', JSON.stringify(error, null, 2));
    throw error;
  }
  console.log('✅ Document artifact successfully inserted into database:', artifact.id);
  // ARTIFACT-RFP LINKING: Link document artifact to the provided RFP with UPSERT logic
  try {
    console.log('🔗 Claude API V3: Linking document artifact to RFP (with upsert):', {
      artifactId: artifact.id,
      rfpId: rfp_id,
      artifactRole: mappedRole
    });
    // Map artifact role to valid rfp_artifacts role values
    let rfpRole = 'buyer'; // Default for documents
    if (mappedRole?.includes('supplier') || mappedRole?.includes('vendor')) {
      rfpRole = 'supplier';
    } else if (mappedRole?.includes('evaluator')) {
      rfpRole = 'evaluator';
    }
    // 🎯 UPSERT LOGIC: Check if artifact_role already exists for this RFP
    // NOTE: This checks for EXACT role match only. Suffixed roles (e.g., "analysis_document_cost_benefit")
    // are treated as unique roles, so multiple analysis/report documents can exist per RFP.
    if (mappedRole) {
      const { data: existingLink, error: checkError } = await supabase.from('rfp_artifacts').select('artifact_id, artifact_role, artifacts!inner(id, name)').eq('rfp_id', rfp_id).eq('artifact_role', mappedRole).maybeSingle();
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('⚠️ Error checking for existing artifact_role:', checkError);
      } else if (existingLink) {
        const existingArtifactId = existingLink.artifact_id;
        const existingArtifactName = existingLink.artifacts.name;
        console.log(`🔄 Document with role "${mappedRole}" already exists for RFP ${rfp_id}. Updating existing artifact: ${existingArtifactId}`);
        // Delete the newly created artifact since we're updating the existing one
        await supabase.from('artifacts').delete().eq('id', artifact.id);
        console.log(`🗑️ Deleted newly created duplicate artifact: ${artifact.id}`);
        // Update the existing artifact with new content
        const { error: updateError } = await supabase.from('artifacts').update({
          name,
          description,
          default_values: {
            content,
            content_type,
            tags
          },
          processed_content: content,
          file_size: content.length,
          mime_type: content_type === 'html' ? 'text/html' : content_type === 'plain' ? 'text/plain' : 'text/markdown',
          metadata: {
            type: 'text',
            content_type,
            description: description || null,
            tags: tags || [],
            user_id: userId,
            updated_reason: 'Regenerated document with same role'
          },
          updated_at: new Date().toISOString()
        }).eq('id', existingArtifactId);
        if (updateError) {
          console.error('❌ Failed to update existing document artifact:', updateError);
          throw new Error(`Failed to update existing document artifact with role "${mappedRole}": ${JSON.stringify(updateError)}`);
        }
        console.log(`✅ Successfully updated existing document artifact: "${existingArtifactName}" (${existingArtifactId})`);
        return {
          success: true,
          artifact_id: existingArtifactId,
          artifact_name: existingArtifactName,
          message: `Updated existing document with role "${mappedRole}": ${existingArtifactName}`,
          is_update: true,
          artifact_role: mappedRole
        };
      }
    }
    // No existing artifact found - create new link
    console.log('📝 No existing document with this role found - creating new artifact link');
    // Insert into rfp_artifacts junction table
    const { error: linkError } = await supabase.from('rfp_artifacts').insert({
      rfp_id: rfp_id,
      artifact_id: artifact.id,
      role: rfpRole,
      artifact_role: mappedRole // Include artifact_role for unique constraint
    });
    if (linkError) {
      console.error('⚠️ Claude API V3: Failed to link document to RFP:', linkError);
      // Enhanced error message for unique constraint violations
      const errorDetails = linkError;
      if (errorDetails.code === '23505' || errorDetails.message?.includes('unique') || errorDetails.message?.includes('duplicate')) {
        throw new Error(`❌ DUPLICATE ROLE ERROR: A document with role "${mappedRole}" was just created by another process for RFP ${rfp_id}. This is a race condition. Please retry your request - the system will update the existing document. Database error: ${JSON.stringify(linkError)}`);
      }
      throw new Error(`Failed to link document artifact to RFP: ${JSON.stringify(linkError)}`);
    }
    console.log('✅ Claude API V3: Successfully linked document to RFP');
  } catch (linkingError) {
    console.error('⚠️ Claude API V3: Error during document linking:', linkingError);
    throw linkingError;
  }
  // ✅ Artifact already linked to session via session_id column in artifacts table
  // No need for redundant session_artifacts junction table insert
  const createdArtifactId = artifact.id;
  console.log('✅ Document artifact created and linked:', {
    artifactId: createdArtifactId,
    sessionId
  });
  return {
    success: true,
    artifact_id: artifact.id,
    artifact_name: name,
    message: `Created ${mappedRole} document artifact: ${name}`
  };
}
// Get conversation history for a session
export async function getConversationHistory(supabase, sessionId, limit = 50) {
  const { data: messages, error } = await supabase.from('messages').select(`
      id,
      session_id,
      agent_id,
      user_id,
      role,
      content,
      created_at,
      agents!inner (
        id,
        name,
        instructions
      )
    `).eq('session_id', sessionId).order('created_at', {
    ascending: true
  }).limit(limit);
  if (error) {
    console.error('Error fetching conversation history:', error);
    return {
      success: false,
      error: String(error),
      data: null
    };
  }
  const messageList = Array.isArray(messages) ? messages : [];
  return {
    success: true,
    data: {
      messages: messageList
    },
    message: `Retrieved ${messageList.length} messages`
  };
}
// Store a message in the conversation
export async function storeMessage(supabase, data) {
  const { sessionId, agentId, userId, sender, content, metadata } = data;
  console.log('Storing message:', {
    sessionId,
    agentId,
    userId,
    sender,
    contentLength: content?.length,
    hasMetadata: !!metadata,
    metadataKeys: metadata ? Object.keys(metadata) : []
  });
  // Get the user's account_id from account_users (required for messages table)
  // userId is the auth user ID (auth.users.id)
  const { data: accountUser, error: accountError } = await supabase.from('account_users').select('account_id').eq('user_id', userId) // account_users.user_id is auth.users.id
  .single();
  if (accountError || !accountUser) {
    console.error('❌ Error finding account for user:', userId, accountError);
    throw new Error(`Account not found for user_id: ${userId}. Cannot store message.`);
  }
  const accountId = accountUser.account_id;
  console.log('✅ Found account_id:', accountId, 'for auth user:', userId);
  const { data: message, error } = await supabase.from('messages').insert({
    session_id: sessionId,
    agent_id: agentId,
    user_id: userId,
    account_id: accountId,
    role: sender,
    content: content,
    metadata: metadata || {},
    created_at: new Date().toISOString()
  }).select().single();
  if (error) {
    console.error('Error storing message:', error);
    throw error;
  }
  return {
    success: true,
    message_id: message.id,
    message: 'Message stored successfully'
  };
}
// Create a new conversation session
export async function createSession(supabase, data) {
  const { userId, title, agentId } = data;
  console.log('🔧 CREATE_SESSION DEBUG START:', {
    userId,
    title,
    agentId,
    userIdType: typeof userId,
    userIdLength: userId?.length,
    timestamp: new Date().toISOString()
  });
  // 🚨 CRITICAL VALIDATION: Require agentId to prevent orphaned sessions
  // All sessions MUST have an agent assigned to avoid "No Agent" sessions in UI
  if (!agentId) {
    console.error('❌ CREATE_SESSION ERROR: agentId is required to prevent orphaned sessions');
    return {
      success: false,
      error: 'Agent ID is required',
      message: 'Cannot create session without an assigned agent. Sessions must have an active agent to prevent orphaned sessions. Use createSessionWithAgent instead or provide agentId parameter.'
    };
  }
  // Get the user's account_id from account_users
  // userId is auth.users.id - sessions.user_id now directly references auth.users
  const { data: accountUser, error: accountError } = await supabase.from('account_users').select('account_id').eq('user_id', userId).single();
  console.log('🔧 Account lookup result:', {
    accountUser,
    accountError: accountError ? JSON.stringify(accountError) : null
  });
  if (accountError || !accountUser) {
    console.error('❌ Account not found for auth user ID:', userId);
    throw new Error(`Account not found for user_id: ${userId}. Error: ${JSON.stringify(accountError)}`);
  }
  const accountId = accountUser.account_id;
  console.log('✅ Found account_id:', accountId, 'for auth user:', userId);
  const sessionData = {
    user_id: userId,
    account_id: accountId,
    title: title || 'New Conversation',
    created_at: new Date().toISOString()
  };
  console.log('🔧 Attempting to insert session:', sessionData);
  const { data: session, error } = await supabase.from('sessions').insert(sessionData).select().single();
  console.log('🔧 Session creation result:', {
    session,
    error: error ? JSON.stringify(error) : null,
    success: !error
  });
  if (error) {
    console.error('❌ Error creating session:', JSON.stringify(error));
    throw error;
  }
  // Link agent to session (REQUIRED - validated above)
  console.log('🔧 Linking agent to session:', {
    sessionId: session.id,
    agentId
  });
  const { error: agentError } = await supabase.from('session_agents').insert({
    session_id: session.id,
    agent_id: agentId,
    started_at: new Date().toISOString() // ✅ Fixed: Use started_at instead of created_at
  });
  if (agentError) {
    console.error('❌ Error linking agent to session:', agentError);
    // Rollback - delete the session since agent assignment failed
    await supabase.from('sessions').delete().eq('id', session.id);
    throw new Error(`Failed to assign agent to session: ${JSON.stringify(agentError)}`);
  }
  console.log('✅ Session created successfully with agent:', {
    sessionId: session.id,
    agentId
  });
  // IMPORTANT: Set this new session as the user's current session
  // This ensures that when the user refreshes, they stay in the new session
  const sessionId = session.id;
  console.log('🔧 Setting new session as current for user:', userId, 'Session:', sessionId);
  const { error: profileUpdateError } = await supabase.from('user_profiles').update({
    current_session_id: sessionId,
    updated_at: new Date().toISOString()
  }).eq('supabase_user_id', userId);
  if (profileUpdateError) {
    // Ignore PGRST204 (schema cache not refreshed yet) - column exists, just not in cache
    if (profileUpdateError.code === 'PGRST204') {
      console.log('ℹ️ PostgREST schema cache not refreshed yet for current_session_id - will work after cache refresh');
    } else {
      console.error('⚠️ Warning: Failed to set current session in user profile:', profileUpdateError);
    }
  // Don't throw here, session creation succeeded, this is just a convenience feature
  } else {
    console.log('✅ Successfully set new session as current session for user');
  }
  // 🎯 LAZY SESSION CREATION: No initial message storage on session creation
  // Welcome messages are handled by React UI via pendingWelcomeMessage state
  // This prevents empty sessions from accumulating in the database
  // Messages are only stored when the user actually interacts with the agent
  console.log('✅ V3: Session created successfully - welcome message handled by React UI');
  console.log('💡 V3: No database message storage on session creation (lazy pattern)');
  console.log('🎯 V3: Session will receive messages only when user sends first message');
  const result = {
    success: true,
    session_id: sessionId,
    message: 'Session created successfully'
  };
  console.log('✅ CREATE_SESSION SUCCESS:', result);
  return result;
}
// Search messages across conversations
export async function searchMessages(supabase, data) {
  const { userId, query, limit = 20 } = data;
  console.log('Searching messages:', {
    userId,
    query,
    limit
  });
  const { data: messages, error } = await supabase.from('messages').select(`
      id,
      session_id,
      agent_id,
      content,
      role,
      created_at,
      sessions!inner (
        id,
        title,
        user_id
      ),
      agents (
        name
      )
    `).eq('sessions.user_id', userId).textSearch('content', query).order('created_at', {
    ascending: false
  }).limit(limit);
  if (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
  return {
    messages: messages || []
  };
}
// Get available agents
export async function getAvailableAgents(supabase, data) {
  const { include_restricted = false } = data;
  console.log('Getting available agents:', {
    include_restricted
  });
  let query = supabase.from('agents').select('id, name, description, role, initial_prompt, is_active, is_free, is_restricted').eq('is_active', true);
  if (!include_restricted) {
    query = query.eq('is_restricted', false);
  }
  const { data: agents, error } = await query.order('name');
  if (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
  // Format agents for display with IDs
  const formattedAgentList = (agents || []).map((agent)=>`**${agent.name}** (${agent.is_free ? 'free' : agent.is_restricted ? 'premium' : 'default'}) - ID: ${agent.id}${agent.description ? ' - ' + agent.description : ''}`);
  return {
    success: true,
    agents: agents || [],
    formatted_agent_list: formattedAgentList.join('\n'),
    agent_switching_instructions: "CRITICAL: When the user requests to switch agents, you MUST call the switch_agent function with session_id and agent_id. Do NOT just mention switching - you must execute the function call. Never say 'switching you to...' without calling switch_agent."
  };
}
// Get current agent for a session
export async function getCurrentAgent(supabase, data) {
  const { session_id } = data;
  console.log('Getting current agent for session:', session_id);
  const { data: sessionAgent, error } = await supabase.from('session_agents').select(`
      agent_id,
      created_at,
      agents!inner (
        id,
        name,
        description,
        role,
        initial_prompt,
        is_active
      )
    `).eq('session_id', session_id).eq('is_active', true).order('created_at', {
    ascending: false
  }).limit(1).single();
  if (error) {
    console.error('Error fetching current agent:', error);
    return {
      success: false,
      error: 'No active agent found for this session',
      current_agent: null
    };
  }
  return {
    success: true,
    current_agent: {
      id: sessionAgent.agents.id,
      name: sessionAgent.agents.name,
      description: sessionAgent.agents.description,
      role: sessionAgent.agents.role,
      initial_prompt: sessionAgent.agents.initial_prompt
    }
  };
}
// Debug agent switch parameters
export function debugAgentSwitch(_supabase, userId, data) {
  const { user_input, extracted_keywords, confusion_reason } = data;
  console.log('🐛 DEBUG AGENT SWITCH:', {
    user_input,
    extracted_keywords,
    confusion_reason,
    userId,
    timestamp: new Date().toISOString()
  });
  return {
    success: true,
    debug_info: {
      user_input,
      extracted_keywords,
      confusion_reason,
      message: 'Debug tool executed - this helps identify why agent switching fails',
      suggestion: 'Common patterns: "rfp design" → "RFP Design", "solutions" → "Solutions", "support" → "Technical Support"'
    }
  };
}
// Intelligent agent detection based on user message keywords
function detectAgentFromMessage(userMessage) {
  const message = userMessage.toLowerCase();
  // Sourcing agent keywords (vendor identification, supplier search, finding vendors)
  // MUST CHECK FIRST to avoid "source" matching RFP Design
  const sourcingKeywords = [
    'sourcing agent',
    'sourcing',
    'find suppliers',
    'find vendors',
    'identify vendors',
    'invite suppliers',
    'send invitations',
    'vendor search'
  ];
  // RFP Design agent keywords (procurement, buying, creating RFPs)
  const rfpKeywords = [
    'rfp design',
    'create rfp',
    'design rfp',
    'buy',
    'purchase',
    'procure',
    'rfp',
    'equipment',
    'supplies',
    'computers',
    'office',
    'furniture',
    'materials',
    'construction',
    'procurement',
    'need to buy',
    'need to purchase'
  ];
  // Solutions agent keywords (sales, product info)
  const salesKeywords = [
    'solutions agent',
    'solutions',
    'sell',
    'products',
    'services',
    'pricing',
    'demo',
    'features',
    'capabilities',
    'what do you offer',
    'how does it work'
  ];
  // Support agent keywords  
  const supportKeywords = [
    'support agent',
    'support',
    'help',
    'problem',
    'issue',
    'bug',
    'error',
    'how to',
    'tutorial'
  ];
  // Check Sourcing FIRST to avoid "sourcing" matching RFP Design via "source"
  if (sourcingKeywords.some((keyword)=>message.includes(keyword))) {
    return 'Sourcing';
  }
  if (rfpKeywords.some((keyword)=>message.includes(keyword))) {
    return 'RFP Design';
  }
  if (salesKeywords.some((keyword)=>message.includes(keyword))) {
    return 'Solutions';
  }
  if (supportKeywords.some((keyword)=>message.includes(keyword))) {
    return 'Support';
  }
  return null;
}
// Switch to a different agent
export async function switchAgent(supabase, userId, data, userMessage) {
  const { session_id, agent_id, agent_name, reason } = data;
  let targetAgent = agent_id || agent_name; // Prioritize agent_id over agent_name
  // If no agent specified, try to detect from user message
  if (!targetAgent && userMessage) {
    const detectedAgent = detectAgentFromMessage(userMessage);
    if (detectedAgent) {
      console.log(`🤖 Auto-detected agent "${detectedAgent}" from user message: "${userMessage.substring(0, 100)}"`);
      targetAgent = detectedAgent;
    }
  }
  // Check if user is anonymous
  const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000001';
  const isAnonymousUser = userId === ANONYMOUS_USER_ID;
  console.log('🔄 AGENT SWITCH REQUEST:', {
    session_id,
    agent_id: agent_id || 'not provided',
    agent_name: agent_name || 'not provided',
    targetAgent: targetAgent || 'not determined',
    reason: reason || 'not provided',
    userId,
    isAnonymousUser,
    userMessage: userMessage ? userMessage.substring(0, 100) + '...' : 'not provided'
  });
  // If no targetAgent was provided by Claude, this is a critical error
  if (!targetAgent && userMessage) {
    console.log('❌ Claude failed to provide agent_name parameter');
    console.log('📝 User message was:', userMessage);
    console.log('💡 This suggests Claude is not following the switch_agent tool instructions properly');
  }
  console.log('🔄 AGENT SWITCH ATTEMPT:', {
    session_id,
    agent_id,
    agent_name,
    targetAgent,
    reason,
    userId,
    isAnonymousUser,
    userMessage: userMessage ? userMessage.substring(0, 50) + '...' : 'not provided',
    timestamp: new Date().toISOString()
  });
  // Validate required parameters
  if (!targetAgent) {
    console.error('❌ Agent switch failed: Neither agent_name nor agent_id provided');
    console.error('❌ Input data:', {
      agent_id,
      agent_name,
      session_id
    });
    throw new Error('Agent switch failed: either agent_name or agent_id is required. Please specify which agent to switch to (e.g., "RFP Design", "Solutions", "Technical Support").');
  }
  console.log('✅ Target agent determined:', targetAgent);
  // Verify agent exists and is active (support both UUID and name)
  let agent, agentError;
  // Check if targetAgent is a UUID (contains hyphens and is 36 chars) or a name
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAgent);
  if (isUUID) {
    // Look up by ID
    const result = await supabase.from('agents').select('id, name, role, instructions, initial_prompt, is_active, is_free, is_restricted').eq('id', targetAgent).eq('is_active', true).single();
    agent = result.data;
    agentError = result.error;
  } else {
    // Look up by name (exact case match first, then case insensitive)
    let result = await supabase.from('agents').select('id, name, role, instructions, initial_prompt, is_active, is_free, is_restricted').eq('name', targetAgent).eq('is_active', true).single();
    // If exact match fails, try case insensitive
    if (result.error) {
      console.log('🔍 Exact match failed, trying case insensitive search for:', targetAgent);
      result = await supabase.from('agents').select('id, name, role, instructions, initial_prompt, is_active, is_free, is_restricted').ilike('name', targetAgent).eq('is_active', true).single();
    }
    agent = result.data;
    agentError = result.error;
  }
  if (agentError || !agent) {
    console.error('❌ Agent not found:', agentError);
    throw new Error(`Agent not found with identifier: ${targetAgent}`);
  }
  // 🔐 AUTHENTICATION & AUTHORIZATION CHECK
  // Validate agent access for anonymous users
  if (isAnonymousUser) {
    const agentObj = agent;
    const agentIsRestricted = agentObj.is_restricted;
    console.log('🔐 Anonymous user agent access validation:', {
      agentName: agentObj.name,
      is_restricted: agentIsRestricted,
      canAccess: !agentIsRestricted
    });
    // Anonymous users can ONLY access non-restricted agents
    // Restricted agents require authentication, regardless of is_free setting
    // This ensures premium features are locked behind sign-up/login
    if (agentIsRestricted) {
      console.log('🚫 ACCESS DENIED: Anonymous user trying to access restricted agent:', agentObj.name);
      throw new Error(`Access denied: The ${agentObj.name} agent requires an account to use. Please sign up or log in to access specialized agents like RFP Design, advanced features, and save your work. Anonymous users can use the Solutions agent for basic assistance.`);
    }
    console.log('✅ Access granted: Anonymous user can access non-restricted agent:', agentObj.name);
  } else {
    console.log('✅ Authenticated user - full agent access granted');
  }
  // CHECK IF WE'RE ALREADY ON THE REQUESTED AGENT - PREVENT REDUNDANT SWITCHES
  const { data: currentSessionAgent, error: currentAgentError } = await supabase.from('session_agents').select(`
      agent_id,
      agents!inner (
        id,
        name
      )
    `).eq('session_id', session_id).eq('is_active', true).order('created_at', {
    ascending: false
  }).limit(1).single();
  if (!currentAgentError && currentSessionAgent) {
    const currentAgentId = currentSessionAgent.agent_id;
    const currentAgentName = currentSessionAgent.agents?.name;
    const targetAgentId = agent.id;
    console.log('🔍 Current vs Target agent check:', {
      current_agent_id: currentAgentId,
      current_agent_name: currentAgentName,
      target_agent_id: targetAgentId,
      target_agent_name: agent.name,
      already_active: currentAgentId === targetAgentId
    });
    // If we're already on the requested agent, return early without switching
    if (currentAgentId === targetAgentId) {
      console.log('⚠️ REDUNDANT AGENT SWITCH DETECTED - Already on target agent:', currentAgentName);
      return {
        success: true,
        session_id,
        already_active: true,
        previous_agent_id: currentAgentId,
        new_agent: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          instructions: agent.instructions,
          initial_prompt: agent.initial_prompt
        },
        switch_reason: reason,
        user_context: data.user_input,
        context_message: `You are already connected to the ${agent.name} agent. How can I help you with your request?`,
        message: `You are already connected to the ${agent.name} agent. How can I help you with your request?`,
        stop_processing: true // Signal that no switch was needed
      };
    }
  }
  // Deactivate current agent for this session
  await supabase.from('session_agents').update({
    is_active: false
  }).eq('session_id', session_id).eq('is_active', true);
  // Activate new agent for this session
  const { error: insertError } = await supabase.from('session_agents').insert({
    session_id,
    agent_id: agent.id,
    is_active: true
  }).select().single();
  if (insertError) {
    console.error('❌ Failed to switch agent:', insertError);
    throw new Error(`Failed to switch agent: ${insertError.message || 'Unknown error'}`);
  }
  console.log('✅ Agent switch completed successfully');
  console.log('✅ Agent switch completed - new agent will read conversation history');
  // Get current RFP context for UI updates
  let currentRfp = null;
  try {
    const { data: sessionData, error: sessionError } = await supabase.from('sessions').select('current_rfp_id').eq('id', session_id).single();
    const sessionRecord = sessionData;
    if (!sessionError && sessionRecord?.current_rfp_id) {
      // Get RFP details
      const { data: rfpData, error: rfpError } = await supabase.from('rfps').select('id, name, status').eq('id', sessionRecord.current_rfp_id).single();
      const rfpRecord = rfpData;
      if (!rfpError && rfpRecord) {
        currentRfp = {
          id: rfpRecord.id,
          title: rfpRecord.name,
          status: rfpRecord.status
        };
        console.log('📋 Current RFP context for UI update:', currentRfp);
      }
    }
  } catch (rfpError) {
    console.warn('⚠️ Could not retrieve RFP context for UI update:', rfpError);
  }
  // No longer pass context directly - new agent will read session messages
  return {
    success: true,
    session_id,
    previous_agent_id: null,
    new_agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      instructions: agent.instructions,
      initial_prompt: agent.initial_prompt
    },
    current_rfp: currentRfp,
    switch_reason: reason,
    message: `Successfully switched to ${agent.name} agent. The ${agent.name} will now read the conversation history and respond accordingly.`,
    trigger_continuation: true // Flag to trigger continuation with new agent reading full conversation
  };
}
// Fetch conversation history for agent switching context
export async function fetchConversationHistory(supabase, sessionId) {
  console.log('📚 Fetching conversation history for session:', sessionId);
  const { data: messages, error } = await supabase.from('messages').select(`
      id,
      role,
      message,
      created_at,
      agent_id,
      is_system_message,
      metadata,
      agents!inner (
        name,
        role
      )
    `).eq('session_id', sessionId).order('created_at', {
    ascending: true
  });
  if (error) {
    console.error('❌ Failed to fetch conversation history:', error);
    throw new Error(`Failed to fetch conversation history: ${error.message || 'Unknown error'}`);
  }
  const rawMessages = messages;
  console.log(`📚 Retrieved ${rawMessages?.length || 0} messages from conversation history`);
  return (rawMessages || []).map((msg)=>{
    // Handle both array and single object from join
    const agentData = Array.isArray(msg.agents) ? msg.agents[0] : msg.agents;
    return {
      id: msg.id,
      role: msg.role,
      message: msg.message,
      created_at: msg.created_at,
      agent_id: msg.agent_id,
      is_system_message: msg.is_system_message,
      metadata: msg.metadata,
      agent_name: agentData?.name,
      agent_role: agentData?.role
    };
  });
}
// Recommend agent for a topic
export async function recommendAgent(supabase, data) {
  const { topic } = data;
  console.log('Recommending agent for topic:', topic);
  // Get all active agents
  const { data: agents, error } = await supabase.from('agents').select('id, name, description, role, initial_prompt, is_active').eq('is_active', true).order('name');
  if (error) {
    console.error('Error fetching agents for recommendation:', error);
    throw error;
  }
  // Simple keyword-based matching (could be enhanced with ML)
  const topicLower = topic.toLowerCase();
  let recommendedAgent = null;
  // Priority matching based on keywords
  const agentMatching = [
    {
      keywords: [
        'sourcing',
        'find suppliers',
        'find vendors',
        'identify vendors',
        'invite suppliers',
        'send invitations',
        'vendor search'
      ],
      agentNames: [
        'Sourcing'
      ]
    },
    {
      keywords: [
        'rfp',
        'request for proposal',
        'bid',
        'procurement'
      ],
      agentNames: [
        'RFP Design',
        'RFP Assistant'
      ]
    },
    {
      keywords: [
        'technical',
        'support',
        'help',
        'error',
        'bug'
      ],
      agentNames: [
        'Technical Support'
      ]
    },
    {
      keywords: [
        'sales',
        'pricing',
        'quote',
        'cost'
      ],
      agentNames: [
        'Solutions'
      ]
    },
    {
      keywords: [
        'contract',
        'negotiate',
        'terms'
      ],
      agentNames: [
        'Negotiation'
      ]
    },
    {
      keywords: [
        'audit',
        'review',
        'compliance'
      ],
      agentNames: [
        'Audit'
      ]
    }
  ];
  for (const matching of agentMatching){
    if (matching.keywords.some((keyword)=>topicLower.includes(keyword))) {
      recommendedAgent = agents?.find((agent)=>matching.agentNames.includes(agent.name));
      if (recommendedAgent) break;
    }
  }
  // Default to RFP Assistant if no specific match
  if (!recommendedAgent && agents && agents.length > 0) {
    recommendedAgent = agents.find((agent)=>agent.name === 'RFP Assistant') || agents[0];
  }
  return {
    success: true,
    recommended_agent: recommendedAgent ? {
      id: recommendedAgent.id,
      name: recommendedAgent.name,
      description: recommendedAgent.description,
      role: recommendedAgent.role,
      reason: recommendedAgent ? `Best match for topic: ${topic}` : 'Default recommendation'
    } : null,
    all_agents: agents || []
  };
}
// List artifacts with optional scope filtering
export async function listArtifacts(supabase, data) {
  const { sessionId, allArtifacts = false, artifactType, limit = 50, userId, filterByCurrentRfp = true } = data;
  console.log('📋 Listing artifacts:', {
    sessionId,
    allArtifacts,
    artifactType,
    limit,
    userId,
    filterByCurrentRfp
  });
  try {
    // If filtering by current RFP, get the RFP ID first
    let currentRfpId = null;
    if (filterByCurrentRfp && sessionId && !allArtifacts) {
      const { data: session } = await supabase.from('sessions').select('current_rfp_id').eq('id', sessionId).single();
      currentRfpId = session?.current_rfp_id || null;
      console.log('📋 Current RFP ID for filtering:', currentRfpId);
    }
    let query = supabase.from('artifacts').select('id, name, type, description, artifact_role, created_at, updated_at, status, session_id').eq('status', 'active').order('created_at', {
      ascending: false
    }).limit(limit);
    if (!allArtifacts && sessionId) {
      // Session-scoped artifacts
      query = query.eq('session_id', sessionId);
    } else if (!allArtifacts) {
      // No session specified and not all artifacts - return empty
      return {
        success: true,
        artifacts: [],
        count: 0,
        scope: 'none'
      };
    }
    // For all artifacts, we'll filter after the query to handle user permissions properly
    if (artifactType) {
      query = query.eq('type', artifactType);
    }
    const { data: artifacts, error } = await query;
    if (error) {
      console.error('❌ Error listing artifacts:', error);
      throw error;
    }
    let artifactList = artifacts || [];
    // Filter by current RFP if requested and RFP is set
    if (filterByCurrentRfp && currentRfpId && artifactList.length > 0) {
      console.log('📋 Filtering artifacts by RFP:', currentRfpId);
      // Get artifact IDs linked to this RFP
      const { data: rfpArtifacts } = await supabase.from('rfp_artifacts').select('artifact_id').eq('rfp_id', currentRfpId);
      const linkedArtifactIds = new Set(rfpArtifacts?.map((ra)=>ra.artifact_id) || []);
      console.log('📋 Artifacts linked to RFP:', linkedArtifactIds.size);
      // Filter to only include artifacts linked to current RFP
      artifactList = artifactList.filter((a)=>linkedArtifactIds.has(a.id));
      console.log('📋 Filtered artifact count:', artifactList.length);
    }
    return {
      success: true,
      artifacts: artifactList,
      count: artifactList.length,
      scope: allArtifacts ? 'account' : 'session',
      session_id: sessionId,
      filter_type: artifactType,
      filtered_by_rfp: filterByCurrentRfp && currentRfpId ? currentRfpId : null
    };
  } catch (error) {
    console.error('❌ Exception listing artifacts:', error);
    throw error;
  }
}
// Get the current artifact ID for a session
export async function getCurrentArtifactId(supabase, data) {
  const { sessionId } = data;
  console.log('🎯 Getting current artifact ID for session:', sessionId);
  try {
    if (!sessionId) {
      return {
        success: true,
        current_artifact_id: null,
        message: 'No session specified'
      };
    }
    // Try to get current artifact from session context
    const { data: sessionData, error: sessionError } = await supabase.from('sessions').select('context').eq('id', sessionId).single();
    if (sessionError) {
      console.warn('⚠️ Could not retrieve session context:', sessionError);
    }
    const sessionRecord = sessionData;
    let currentArtifactId = null;
    if (sessionRecord?.context && typeof sessionRecord.context === 'object') {
      currentArtifactId = sessionRecord.context.current_artifact_id || null;
    }
    // If no current artifact in context, get the most recent artifact for the session
    if (!currentArtifactId) {
      const { data: artifacts, error: artifactsError } = await supabase.from('artifacts').select('id').eq('session_id', sessionId).eq('status', 'active').order('created_at', {
        ascending: false
      }).limit(1);
      const artifactList = artifacts || [];
      if (!artifactsError && artifactList.length > 0) {
        currentArtifactId = artifactList[0].id;
      }
    }
    return {
      success: true,
      current_artifact_id: currentArtifactId,
      session_id: sessionId,
      source: currentArtifactId ? sessionRecord?.context ? 'session_context' : 'most_recent' : 'none'
    };
  } catch (error) {
    console.error('❌ Exception getting current artifact ID:', error);
    throw error;
  }
}
// Select an artifact to be displayed in the artifact window
export async function selectActiveArtifact(supabase, data) {
  const { artifactId, sessionId } = data;
  console.log('🎯 Selecting active artifact:', {
    artifactId,
    sessionId
  });
  try {
    // Verify the artifact exists and get its details
    const { data: artifact, error: artifactError } = await supabase.from('artifacts').select('id, name, type, session_id, status').eq('id', artifactId).single();
    if (artifactError || !artifact) {
      return {
        success: false,
        error: 'Artifact not found',
        artifact_id: artifactId
      };
    }
    const artifactRecord = artifact;
    if (artifactRecord.status !== 'active') {
      return {
        success: false,
        error: 'Artifact is not active',
        artifact_id: artifactId,
        status: artifactRecord.status
      };
    }
    // If sessionId is provided, update the session context
    if (sessionId) {
      // Get current session context
      const { data: sessionData, error: sessionError } = await supabase.from('sessions').select('context').eq('id', sessionId).single();
      const sessionRecord = sessionData;
      let context = {};
      if (!sessionError && sessionRecord?.context) {
        context = sessionRecord.context;
      }
      // Update context with current artifact
      const updatedContext = {
        ...context,
        current_artifact_id: artifactId
      };
      const { error: updateError } = await supabase.from('sessions').update({
        context: updatedContext
      }).eq('id', sessionId);
      if (updateError) {
        console.warn('⚠️ Failed to update session context:', updateError);
      }
    }
    return {
      success: true,
      artifact_id: artifactId,
      artifact_name: artifactRecord.name,
      artifact_type: artifactRecord.type,
      session_id: sessionId,
      message: `Active artifact set to: ${artifactRecord.name}`
    };
  } catch (error) {
    console.error('❌ Exception selecting active artifact:', error);
    throw error;
  }
}
// Get form schema to see field names and types before updating
export async function getFormSchema(supabase, _sessionId, _userId, data) {
  console.log('🔍 Getting form schema for:', data);
  const { artifact_id, session_id } = data;
  if (!artifact_id) {
    throw new Error('Artifact ID is required for getting form schema');
  }
  if (!session_id) {
    throw new Error('Session ID is required for getting form schema');
  }
  // Use same resolution logic as updateFormData
  let resolvedArtifactId = artifact_id;
  let existingArtifact = null;
  try {
    // Try UUID first
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artifact_id);
    if (isUUID) {
      const { data, error } = await supabase.from('artifacts').select('id, name, type, schema, ui_schema, default_values').eq('id', artifact_id).eq('type', 'form').single();
      if (!error && data) {
        existingArtifact = data;
        resolvedArtifactId = artifact_id;
      }
    }
    // Try by name in session
    if (!existingArtifact) {
      const { data, error } = await supabase.from('artifacts').select('id, name, type, schema, ui_schema, default_values').eq('session_id', session_id).eq('type', 'form').eq('name', artifact_id).single();
      if (!error && data) {
        existingArtifact = data;
        resolvedArtifactId = data.id;
      } else {
        // Try fuzzy matching
        const { data: candidates, error: fuzzyError } = await supabase.from('artifacts').select('id, name, type, schema, ui_schema, default_values').eq('session_id', session_id).eq('type', 'form').ilike('name', `%${artifact_id}%`);
        if (!fuzzyError && candidates && Array.isArray(candidates) && candidates.length > 0) {
          existingArtifact = candidates[0];
          resolvedArtifactId = existingArtifact.id;
        }
      }
    }
    // Fallback to most recent form
    if (!existingArtifact) {
      const { data: currentArtifacts, error: currentError } = await supabase.from('artifacts').select('id, name, type, schema, ui_schema, default_values').eq('session_id', session_id).eq('type', 'form').order('updated_at', {
        ascending: false
      }).limit(1);
      if (!currentError && currentArtifacts && Array.isArray(currentArtifacts) && currentArtifacts.length > 0) {
        existingArtifact = currentArtifacts[0];
        resolvedArtifactId = existingArtifact.id;
      }
    }
    if (!existingArtifact) {
      throw new Error(`No form artifact found matching: ${artifact_id}`);
    }
    const schema = existingArtifact.schema || {};
    const ui_schema = existingArtifact.ui_schema || {};
    const default_values = existingArtifact.default_values || {};
    console.log('✅ Retrieved form schema:', {
      artifact_id: resolvedArtifactId,
      name: existingArtifact.name,
      field_count: Object.keys(schema.properties || {}).length
    });
    return {
      artifact_id: resolvedArtifactId,
      name: existingArtifact.name,
      schema,
      ui_schema,
      default_values,
      field_names: Object.keys(schema.properties || {}),
      message: `Form schema retrieved for: ${existingArtifact.name}`
    };
  } catch (error) {
    console.error('❌ Exception getting form schema:', error);
    throw error;
  }
}
// Update form data for an existing form artifact
export async function updateFormData(supabase, _sessionId, _userId, data) {
  console.log('🔄 Starting updateFormData with params:', JSON.stringify(data, null, 2));
  const { artifact_id, form_data, session_id } = data;
  console.log('🔄 Updating form data:', {
    artifact_id,
    userId: _userId,
    session_id
  });
  console.log('🔍 Form data to set:', form_data);
  if (!artifact_id) {
    throw new Error('Artifact ID is required for updating form data');
  }
  if (!form_data || typeof form_data !== 'object') {
    throw new Error('Form data must be a valid object');
  }
  if (!session_id) {
    throw new Error('Session ID is required for updating form data');
  }
  let resolvedArtifactId = artifact_id;
  let existingArtifact = null;
  try {
    // First try to find the artifact by ID (UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artifact_id);
    if (isUUID) {
      console.log('🔍 Searching by UUID:', artifact_id);
      const { data, error } = await supabase.from('artifacts').select('id, name, type, artifact_role, schema, user_id, session_id').eq('id', artifact_id).eq('type', 'form').single();
      if (!error && data) {
        existingArtifact = data;
        resolvedArtifactId = artifact_id;
      }
    }
    // If not found by UUID or not a UUID, try to find by name in the current session
    if (!existingArtifact) {
      console.log('🔍 Searching by name in session:', {
        name: artifact_id,
        session_id
      });
      // Try exact name match first
      const { data, error } = await supabase.from('artifacts').select('id, name, type, artifact_role, schema, user_id, session_id').eq('session_id', session_id).eq('type', 'form').eq('name', artifact_id).single();
      if (!error && data) {
        existingArtifact = data;
        resolvedArtifactId = data.id;
        console.log('✅ Found artifact by exact name match:', resolvedArtifactId);
      } else {
        // Try fuzzy name matching (case-insensitive, partial matches)
        console.log('🔍 Trying fuzzy name matching...');
        const { data: candidates, error: fuzzyError } = await supabase.from('artifacts').select('id, name, type, artifact_role, schema, user_id, session_id').eq('session_id', session_id).eq('type', 'form').ilike('name', `%${artifact_id}%`);
        if (!fuzzyError && candidates && Array.isArray(candidates) && candidates.length > 0) {
          // Pick the first candidate (could be enhanced with better matching logic)
          existingArtifact = candidates[0];
          resolvedArtifactId = existingArtifact.id;
          console.log('✅ Found artifact by fuzzy name match:', {
            resolvedId: resolvedArtifactId,
            actualName: existingArtifact.name
          });
        }
      }
    }
    // If still not found, get the currently active artifact as fallback
    if (!existingArtifact) {
      console.log('🔍 Trying to get currently active form artifact...');
      const { data: currentArtifacts, error: currentError } = await supabase.from('artifacts').select('id, name, type, artifact_role, schema, user_id, session_id').eq('session_id', session_id).eq('type', 'form').order('updated_at', {
        ascending: false
      }).limit(1);
      if (!currentError && currentArtifacts && Array.isArray(currentArtifacts) && currentArtifacts.length > 0) {
        existingArtifact = currentArtifacts[0];
        resolvedArtifactId = existingArtifact.id;
        console.log('✅ Using most recently updated form artifact:', {
          resolvedId: resolvedArtifactId,
          actualName: existingArtifact.name
        });
      }
    }
    // Final check - if no artifact found, throw error
    if (!existingArtifact) {
      console.error('❌ No form artifact found for:', {
        artifact_id,
        session_id
      });
      throw new Error(`No form artifact found matching: ${artifact_id}`);
    }
    console.log('✅ Found existing form artifact:', {
      name: existingArtifact.name,
      user_id: existingArtifact.user_id,
      current_user: _userId,
      resolvedId: resolvedArtifactId
    });
    // Get current auth context for debugging
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;
    console.log('🔐 Auth context:', {
      authError,
      user_id: user?.id,
      artifact_user_id: existingArtifact.user_id,
      match: user?.id === existingArtifact.user_id
    });
    // Update the default_values field with the new form data using the resolved artifact ID
    const { data: updatedData, error: updateError } = await supabase.from('artifacts').update({
      default_values: form_data,
      updated_at: new Date().toISOString()
    }).eq('id', resolvedArtifactId).select('id, name, default_values, updated_at').single();
    if (updateError) {
      console.error('❌ Error updating form data:', updateError);
      console.error('❌ Update error details:', JSON.stringify(updateError, null, 2));
      throw updateError;
    }
    if (!updatedData) {
      console.error('❌ No data returned from update - possible RLS policy block');
      throw new Error('Update succeeded but no data returned - check RLS policies');
    }
    // CRITICAL: Verify the update actually worked by checking the returned data
    const returnedDefaultValues = updatedData.default_values;
    if (!returnedDefaultValues || typeof returnedDefaultValues !== 'object') {
      console.error('❌ Update claimed success but default_values is null/invalid:', {
        returnedDefaultValues
      });
      throw new Error('Update failed: default_values was not properly updated');
    }
    // Verify at least some of the form_data was actually saved
    const expectedFormKeys = Object.keys(form_data);
    const savedDataKeys = Object.keys(returnedDefaultValues);
    const commonKeys = expectedFormKeys.filter((key)=>savedDataKeys.includes(key));
    if (commonKeys.length === 0 && expectedFormKeys.length > 0) {
      console.error('❌ Update claimed success but no form data was actually saved:', {
        expectedKeys: expectedFormKeys,
        actualKeys: savedDataKeys,
        form_data,
        returnedDefaultValues
      });
      throw new Error('Update failed: none of the provided form data was saved to the database');
    }
    console.log('✅ Update verification passed:', {
      expectedKeys: expectedFormKeys.length,
      savedKeys: savedDataKeys.length,
      commonKeys: commonKeys.length,
      sampleSavedData: commonKeys.slice(0, 3).reduce((obj, key)=>({
          ...obj,
          [key]: returnedDefaultValues[key]
        }), {})
    });
    // FINAL VERIFICATION: Re-read the artifact to ensure data persistence
    console.log('🔍 Final verification: re-reading artifact to confirm persistence...');
    const { data: verificationData, error: verificationError } = await supabase.from('artifacts').select('id, name, default_values, updated_at').eq('id', resolvedArtifactId).single();
    if (verificationError) {
      console.error('❌ Verification read failed:', verificationError);
      throw new Error(`Update appeared successful but verification read failed: ${JSON.stringify(verificationError)}`);
    }
    if (!verificationData) {
      console.error('❌ Verification read returned no data - artifact may have been deleted');
      throw new Error('Update appeared successful but artifact no longer exists');
    }
    const verifiedDefaultValues = verificationData.default_values;
    if (!verifiedDefaultValues || typeof verifiedDefaultValues !== 'object') {
      console.error('❌ Verification failed: default_values is null/invalid after update');
      throw new Error('Update failed: default_values was not persisted to database');
    }
    // Compare the verification data with what we expected to save
    const finalFormKeys = Object.keys(form_data);
    const verifiedKeys = Object.keys(verifiedDefaultValues);
    const persistedKeys = finalFormKeys.filter((key)=>verifiedKeys.includes(key));
    if (persistedKeys.length === 0 && finalFormKeys.length > 0) {
      console.error('❌ Verification failed: no form data was actually persisted:', {
        expectedKeys: finalFormKeys,
        verifiedKeys: verifiedKeys,
        expectedData: form_data,
        verifiedData: verifiedDefaultValues
      });
      throw new Error('Update failed: form data was not persisted to database');
    }
    console.log('✅ Form data updated and verified successfully:', {
      original_artifact_id: artifact_id,
      resolved_artifact_id: resolvedArtifactId,
      name: existingArtifact.name,
      expected_keys: finalFormKeys.length,
      persisted_keys: persistedKeys.length,
      verification_timestamp: verificationData.updated_at
    });
    return {
      success: true,
      artifact_id: resolvedArtifactId,
      original_artifact_id: artifact_id,
      name: existingArtifact.name,
      form_data,
      session_id,
      updated_at: verificationData.updated_at,
      verified: true,
      persisted_keys: persistedKeys.length,
      message: `Form data for "${existingArtifact.name}" updated and verified successfully with ${persistedKeys.length} fields. ${artifact_id !== resolvedArtifactId ? `(Resolved "${artifact_id}" to UUID: ${resolvedArtifactId})` : ''}`
    };
  } catch (error) {
    console.error('❌ Error updating form data:', error);
    throw error;
  }
}
// Update form artifact with new data or schema
export async function updateFormArtifact(supabase, _sessionId, _userId, data) {
  const { artifact_id, updates } = data;
  console.log('✏️ Updating form artifact:', {
    artifact_id,
    userId: _userId
  });
  if (!artifact_id) {
    throw new Error('Artifact ID is required for updating');
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }
  try {
    // Get the existing artifact to validate schema compatibility
    const { data: existingArtifact, error: checkError } = await supabase.from('artifacts').select('*').eq('id', artifact_id).single();
    if (!existingArtifact || checkError) {
      throw new Error(`Artifact not found: ${artifact_id}`);
    }
    // Update the artifact in database
    const { data: updatedArtifact, error: updateError } = await supabase.from('artifacts').update({
      name: updates.title || existingArtifact.name,
      description: updates.description || existingArtifact.description,
      schema: updates.form_schema || existingArtifact.schema,
      ui_schema: updates.ui_schema || existingArtifact.ui_schema,
      default_values: updates.default_values || existingArtifact.default_values,
      submit_action: updates.submit_action || existingArtifact.submit_action,
      updated_at: new Date().toISOString()
    }).eq('id', artifact_id).select().single();
    if (updateError) {
      console.error('❌ Failed to update artifact in database:', updateError);
      throw new Error(`Failed to update artifact: ${String(updateError)}`);
    }
    console.log('✅ Form artifact updated successfully:', {
      artifact_id
    });
    // Return the updated artifact content so frontend can refresh the form
    const artifactContent = {
      schema: updatedArtifact.schema,
      uiSchema: updatedArtifact.ui_schema || {},
      formData: updatedArtifact.default_values || {},
      submitAction: updatedArtifact.submit_action || {
        type: 'save_session'
      }
    };
    return {
      success: true,
      artifact_id,
      updated: true,
      updated_fields: Object.keys(updates),
      updated_at: new Date().toISOString(),
      title: updatedArtifact.name,
      description: updatedArtifact.description,
      type: 'form',
      content: JSON.stringify(artifactContent),
      message: `Artifact "${artifact_id}" updated successfully`
    };
  } catch (error) {
    console.error('❌ Error updating form artifact:', error);
    throw error;
  }
}
// =====================================
// BID SUBMISSION FUNCTIONS
// =====================================
export async function submitBid(supabase, sessionId, userId, data) {
  console.log('🎯 Submitting bid:', data);
  try {
    // DIRECT DATABASE INSERT PATH (when no artifact_id provided)
    if (!data.artifact_id && (data.supplier_name || data.bid_price || data.delivery_days)) {
      console.log('💾 Direct bid submission without artifact (simplified path)');
      // Get agent_id and account_id from session
      const { data: sessionData } = await supabase.from('sessions').select('agent_id, account_id').eq('id', sessionId).single();
      const agentId = sessionData && typeof sessionData === 'object' && 'agent_id' in sessionData ? sessionData.agent_id : 1;
      const accountId = sessionData && typeof sessionData === 'object' && 'account_id' in sessionData ? sessionData.account_id : null;
      // Get account_id using the new helper function
      let finalAccountId = accountId;
      if (!finalAccountId) {
        // Try getting from get_user_account_id() function
        const rpcClient = supabase;
        const { data: userAccountId, error: accountError } = await rpcClient.rpc('get_user_account_id');
        if (!accountError && userAccountId) {
          finalAccountId = userAccountId;
          console.log('👤 Using user account_id from get_user_account_id():', finalAccountId);
        } else if (!accountError) {
          // If get_user_account_id() returns null, try RFP account_id as fallback
          const { data: rfpData } = await supabase.from('rfps').select('account_id').eq('id', data.rfp_id).single();
          if (rfpData && typeof rfpData === 'object' && 'account_id' in rfpData) {
            finalAccountId = rfpData.account_id;
            console.log('📋 Using RFP account_id:', finalAccountId);
          }
        } else {
          console.warn('⚠️ Error calling get_user_account_id():', accountError);
        }
      }
      // AUTO-CREATE OR FIND SUPPLIER PROFILE
      let supplierId = data.supplier_id;
      if (!supplierId && data.supplier_name) {
        console.log('🔍 Checking for existing supplier:', data.supplier_name);
        // Check if supplier already exists (use limit(1) to avoid single() error when no match)
        const { data: existingSuppliers, error: lookupError } = await supabase.from('supplier_profiles').select('id').eq('name', data.supplier_name).limit(1);
        if (lookupError) {
          console.error('❌ Error looking up supplier:', lookupError);
          throw new Error(`Failed to lookup supplier: ${String(lookupError)}`);
        }
        const existingSupplierArray = existingSuppliers;
        const existingSupplier = existingSupplierArray && existingSupplierArray.length > 0 ? existingSupplierArray[0] : null;
        if (existingSupplier && typeof existingSupplier === 'object' && 'id' in existingSupplier) {
          supplierId = existingSupplier.id;
          console.log('✅ Found existing supplier:', {
            supplierId
          });
        } else {
          // Create new supplier profile
          console.log('➕ Creating new supplier profile:', data.supplier_name);
          const { data: newSupplier, error: supplierError } = await supabase.from('supplier_profiles').insert({
            name: data.supplier_name,
            description: `Auto-created supplier profile for ${data.supplier_name}`
          }).select('id').single();
          if (supplierError) {
            console.error('❌ Error creating supplier profile:', supplierError);
            throw new Error(`Failed to create supplier profile: ${String(supplierError)}`);
          }
          if (!newSupplier || typeof newSupplier !== 'object' || !('id' in newSupplier)) {
            console.error('❌ Supplier creation returned no data');
            throw new Error('Supplier profile was not created (no ID returned)');
          }
          supplierId = newSupplier.id;
          console.log('✅ Created new supplier:', {
            supplierId,
            supplierData: newSupplier
          });
        }
      }
      // CRITICAL VALIDATION: Ensure we have a supplier_id before inserting bid
      if (!supplierId) {
        console.error('❌ No supplier_id available for bid submission', {
          hasSupplierName: !!data.supplier_name,
          hasDirectSupplierId: !!data.supplier_id,
          finalSupplierId: supplierId
        });
        throw new Error('Cannot submit bid without a valid supplier. Please provide either supplier_name or supplier_id.');
      }
      // Build response JSONB with bid details
      const response = {
        supplier_name: data.supplier_name || 'Unknown Supplier',
        amount: data.bid_price || 0,
        delivery_timeline: data.delivery_days ? `${data.delivery_days} days` : 'Not specified',
        status: 'pending',
        submitted_via: 'direct_agent_submission',
        submitted_at: new Date().toISOString()
      };
      // Direct INSERT into bids table
      const { data: insertedBid, error: insertError } = await supabase.from('bids').insert({
        rfp_id: data.rfp_id,
        agent_id: agentId,
        supplier_id: supplierId || null,
        account_id: finalAccountId,
        response: response,
        bid_amount: data.bid_price || null,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }).select('id').single();
      if (insertError) {
        console.error('❌ Error inserting bid directly:', insertError);
        throw new Error(`Failed to insert bid: ${String(insertError)}`);
      }
      const bidId = insertedBid && typeof insertedBid === 'object' && 'id' in insertedBid ? insertedBid.id : undefined;
      console.log('✅ Bid inserted directly:', {
        bidId
      });
      return {
        success: true,
        bid_id: bidId,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        message: `✅ **Bid Successfully Submitted!**

📋 **Submission Details:**
- **Bid ID**: ${bidId}
- **Status**: Submitted
- **Submitted At**: ${new Date().toLocaleString()}

💰 **Bid Information:**
- **Supplier**: ${data.supplier_name}
- **Amount**: $${Number(data.bid_price).toLocaleString()}
- **Delivery**: ${data.delivery_days} days

🎯 **Next Steps:**
- Bid is now visible in the Bids view
- RFP owner will be notified of the submission
- Bid status can be tracked through the system
- Evaluation and ranking will be conducted by the buyer`
      };
    }
    // ARTIFACT-BASED SUBMISSION PATH (original logic)
    if (!data.artifact_id) {
      throw new Error('Either artifact_id or direct bid data (supplier_name, bid_price, delivery_days) must be provided');
    }
    // If form data is provided, save it to artifact first
    if (data.form_data) {
      console.log('💾 Saving form data to artifact before submission');
      const { error: saveError } = await supabase.from('artifacts').update({
        default_values: data.form_data,
        updated_at: new Date().toISOString()
      }).eq('id', data.artifact_id);
      if (saveError) {
        console.error('⚠️ Error saving form data:', saveError);
      // Continue anyway, as the data might already be saved
      }
    }
    // Get account_id from session for RLS compliance
    const { data: sessionData } = await supabase.from('sessions').select('account_id').eq('id', sessionId).single();
    const accountId = sessionData && typeof sessionData === 'object' && 'account_id' in sessionData ? sessionData.account_id : null;
    // Call the submit_bid database function
    // Note: Using type assertion for RPC call as SupabaseClient type doesn't include rpc method
    const rpcClient = supabase;
    const rpcResult = await rpcClient.rpc('submit_bid', {
      rfp_id_param: data.rfp_id,
      artifact_id_param: data.artifact_id,
      supplier_id_param: data.supplier_id || null,
      agent_id_param: null,
      session_id_param: sessionId,
      user_id_param: userId,
      account_id_param: accountId
    });
    if (rpcResult.error) {
      console.error('❌ Error submitting bid:', rpcResult.error);
      throw new Error(`Failed to submit bid: ${String(rpcResult.error)}`);
    }
    if (!rpcResult.data) {
      throw new Error('No submission ID returned from database function');
    }
    const submissionId = rpcResult.data;
    console.log('✅ Bid submitted successfully:', {
      submissionId
    });
    // Get the created bid ID from the submission metadata
    const { data: submissionData } = await supabase.from('artifact_submissions').select('metadata').eq('id', submissionId).single();
    let bidId;
    if (submissionData && typeof submissionData === 'object') {
      const record = submissionData;
      if (record.metadata && typeof record.metadata === 'object') {
        const metadata = record.metadata;
        if (typeof metadata.bid_id === 'number') {
          bidId = metadata.bid_id;
        }
      }
    }
    // Extract bid information for the summary
    const { data: artifactData } = await supabase.from('artifacts').select('default_values').eq('id', data.artifact_id).single();
    let formData = {};
    if (artifactData && typeof artifactData === 'object') {
      const record = artifactData;
      if (record.default_values && typeof record.default_values === 'object') {
        formData = record.default_values;
      }
    }
    // Extract bid details
    const bidAmount = formData.bid_amount || formData.amount || formData.price || formData.cost;
    const deliveryDate = formData.delivery_date || formData.deliveryDate || formData.delivery;
    const companyName = formData.company_name || formData.companyName || formData.supplier_name;
    // Create or update a "Bids" artifact to trigger bid view refresh
    try {
      // Get RFP name for artifact
      const { data: rfpData } = await supabase.from('rfps').select('name').eq('id', data.rfp_id).single();
      const rfpName = rfpData && typeof rfpData === 'object' && 'name' in rfpData ? String(rfpData.name) : 'RFP';
      // Check if a bid view artifact already exists for this session and RFP
      const { data: existingArtifacts } = await supabase.from('artifacts').select('id').eq('session_id', sessionId).eq('type', 'bid_view').eq('rfp_id', data.rfp_id).limit(1);
      if (existingArtifacts && Array.isArray(existingArtifacts) && existingArtifacts.length > 0) {
        // Update existing artifact's updated_at to trigger refresh
        const firstArtifact = existingArtifacts[0];
        const artifactId = firstArtifact.id;
        await supabase.from('artifacts').update({
          updated_at: new Date().toISOString()
        }).eq('id', artifactId);
        console.log('✅ Updated existing bid view artifact:', artifactId);
      } else {
        // Create new bid view artifact
        const { error: artifactError } = await supabase.from('artifacts').insert({
          name: `Bids for ${rfpName}`,
          type: 'bid_view',
          content: rfpName,
          session_id: sessionId,
          user_id: userId,
          rfp_id: data.rfp_id,
          size: '0 KB',
          mime_type: 'application/x-bid-view'
        });
        if (!artifactError) {
          console.log('✅ Created new bid view artifact for RFP:', data.rfp_id);
        }
      }
    } catch (artifactError) {
      console.warn('⚠️ Failed to create/update bid view artifact:', artifactError);
    // Don't fail the bid submission if artifact creation fails
    }
    return {
      success: true,
      submission_id: submissionId,
      bid_id: bidId,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      message: `✅ **Bid Successfully Submitted!**

📋 **Submission Details:**
- **Bid ID**: ${bidId || 'Pending'}
- **Submission ID**: ${submissionId}
- **Status**: Submitted
- **Submitted At**: ${new Date().toLocaleString()}

💰 **Bid Information:**${bidAmount ? `
- **Amount**: $${Number(bidAmount).toLocaleString()}` : ''}${deliveryDate ? `
- **Delivery Date**: ${deliveryDate}` : ''}${companyName ? `
- **Company**: ${companyName}` : ''}

🎯 **Next Steps:**
- Bid is now visible in the Bids view
- RFP owner will be notified of the submission
- Bid status can be tracked through the system
- Evaluation and ranking will be conducted by the buyer`
    };
  } catch (error) {
    console.error('❌ Error in submitBid:', error);
    return {
      success: false,
      error: String(error),
      message: `❌ **Bid Submission Failed**: ${String(error)}`
    };
  }
}
export async function getRfpBids(supabase, data) {
  console.log('📋 Getting RFP bids:', data);
  try {
    // Debug: Log which database we're querying (use unknown for protected property access)
    const clientUrl = String(supabase['supabaseUrl'] || 'unknown');
    console.log('🔍 Supabase client connected to:', clientUrl);
    // 🚨 TEMPORARY TEST: Import service role client to test RLS hypothesis
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const testClient = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { data: serviceRoleTest, error: serviceError } = await testClient.from('bids').select('count');
    console.log('🧪 SERVICE ROLE TEST:', {
      count: serviceRoleTest,
      error: serviceError
    });
    // Direct table query instead of RPC to bypass PostgREST REST API issue
    console.log('🔍 Executing query: bids table, rfp_id =', data.rfp_id);
    // First, test if we can query the table at all
    const { data: testBids, error: testError } = await supabase.from('bids').select('count');
    console.log('🔍 Test query (count all bids WITH RLS CLIENT):', {
      count: testBids,
      testError
    });
    const { data: bids, error } = await supabase.from('bids').select('*').eq('rfp_id', data.rfp_id).order('created_at', {
      ascending: false
    });
    console.log('🔍 Query result:', {
      bids,
      error,
      hasData: !!bids,
      bidCount: Array.isArray(bids) ? bids.length : 0
    });
    if (error) {
      console.error('❌ Error getting RFP bids:', error);
      throw new Error(`Failed to get RFP bids: ${String(error)}`);
    }
    const bidsArray = Array.isArray(bids) ? bids : [];
    console.log('✅ Retrieved RFP bids:', {
      count: bidsArray.length,
      firstBid: bidsArray[0]
    });
    return {
      success: true,
      bids: bidsArray,
      count: bidsArray.length,
      message: `Found ${bidsArray.length} bids for RFP ${data.rfp_id}`,
      _debug: {
        serviceRoleCount: Array.isArray(serviceRoleTest) && serviceRoleTest.length > 0 ? serviceRoleTest[0].count : 0,
        rlsClientCount: Array.isArray(testBids) && testBids.length > 0 ? testBids[0].count : 0,
        clientUrl: clientUrl,
        queryRfpId: data.rfp_id
      }
    };
  } catch (error) {
    console.error('❌ Error in getRfpBids:', error);
    return {
      success: false,
      error: String(error),
      bids: [],
      count: 0,
      message: `Failed to get bids: ${String(error)}`
    };
  }
}
export async function updateBidStatus(supabase, data) {
  console.log('🔄 Updating bid status:', data);
  try {
    const rpcClient = supabase;
    const { error } = await rpcClient.rpc('update_bid_status', {
      bid_id_param: data.bid_id,
      new_status: data.status,
      status_reason_param: data.status_reason || null,
      reviewer_id_param: data.reviewer_id || null,
      score_param: data.score || null
    });
    if (error) {
      console.error('❌ Error updating bid status:', error);
      throw new Error(`Failed to update bid status: ${String(error)}`);
    }
    console.log('✅ Bid status updated successfully');
    return {
      success: true,
      bid_id: data.bid_id,
      new_status: data.status,
      updated_at: new Date().toISOString(),
      message: `Bid ${data.bid_id} status updated to "${data.status}"${data.status_reason ? ` (${data.status_reason})` : ''}`
    };
  } catch (error) {
    console.error('❌ Error in updateBidStatus:', error);
    return {
      success: false,
      error: String(error),
      message: `Failed to update bid status: ${String(error)}`
    };
  }
}
/**
 * Generate placeholder embedding vector
 * Returns array of 1024 zeros for vector(1024) column (Voyage AI dimension)
 * TODO: Replace with real embedding generation via generate-embedding function
 */ function generatePlaceholderEmbedding() {
  return new Array(1024).fill(0);
}
/**
 * Create a new memory entry for an agent
 * Stores important information about user preferences, decisions, facts, and context
 */ export async function createMemory(supabase, params, userId, agentId, sessionId) {
  console.log('🧠 Creating memory:', {
    ...params,
    userId,
    agentId,
    sessionId
  });
  try {
    // Validate importance score
    if (params.importance_score < 0 || params.importance_score > 1) {
      throw new Error('importance_score must be between 0.0 and 1.0');
    }
    // Get the user's account_id from account_users
    // userId is auth.users.id - account_memories.user_id now directly references auth.users
    const { data: accountUser, error: accountError } = await supabase.from('account_users').select('account_id').eq('user_id', userId) // Use auth user ID directly
    .single();
    if (accountError || !accountUser) {
      console.error('❌ Error finding account for user:', accountError);
      throw new Error(`Account not found for user_id: ${userId}`);
    }
    const accountId = accountUser.account_id;
    console.log('✅ Found account_id:', accountId, 'for auth user:', userId);
    // Generate placeholder embedding (will be replaced with real embeddings later)
    const embedding = generatePlaceholderEmbedding();
    // Insert memory record using account-based schema
    const { data: memory, error: memoryError } = await supabase.from('account_memories').insert({
      account_id: accountId,
      user_id: userId,
      session_id: sessionId,
      content: params.content,
      memory_type: params.memory_type,
      importance_score: params.importance_score,
      embedding: embedding,
      metadata: {}
    }).select('id').single();
    if (memoryError) {
      console.error('❌ Error creating memory:', memoryError);
      throw new Error(`Failed to create memory: ${String(memoryError)}`);
    }
    const memoryId = memory.id;
    console.log('✅ Memory created:', memoryId);
    // Create memory reference if reference_id provided
    if (params.reference_id && params.reference_type) {
      console.log('🔗 Creating memory reference:', {
        reference_type: params.reference_type,
        reference_id: params.reference_id
      });
      const { error: refError } = await supabase.from('memory_references').insert({
        memory_id: memoryId,
        reference_type: params.reference_type,
        reference_id: params.reference_id
      });
      if (refError) {
        console.warn('⚠️ Warning: Failed to create memory reference:', refError);
      // Don't fail the entire operation if reference creation fails
      } else {
        console.log('✅ Memory reference created');
      }
    }
    return {
      success: true,
      memory_id: memoryId,
      message: `Memory stored successfully: "${params.content.substring(0, 50)}${params.content.length > 50 ? '...' : ''}"`
    };
  } catch (error) {
    console.error('❌ Error in createMemory:', error);
    return {
      success: false,
      error: String(error),
      message: `Failed to create memory: ${String(error)}`
    };
  }
}
/**
 * Search for relevant memories from past conversations
 * Uses semantic search with vector similarity (currently using placeholder embeddings)
 */ export async function searchMemories(supabase, params, userId, agentId) {
  console.log('🔍 Searching memories:', {
    ...params,
    userId,
    agentId
  });
  try {
    // Get the user's account_id from account_users
    // userId is auth.users.id - account_memories.user_id now directly references auth.users
    const { data: accountUser, error: accountError } = await supabase.from('account_users').select('account_id').eq('user_id', userId) // Use auth user ID directly
    .single();
    if (accountError || !accountUser) {
      console.error('❌ Error finding account for user:', accountError);
      throw new Error(`Account not found for user_id: ${userId}`);
    }
    const accountId = accountUser.account_id;
    console.log('✅ Searching memories for account_id:', accountId, 'auth user:', userId);
    // Parse memory types from comma-separated string
    const memoryTypes = params.memory_types ? params.memory_types.split(',').map((t)=>t.trim()) : undefined;
    const limit = params.limit || 10;
    // Generate placeholder embedding for query (will be replaced with real embeddings later)
    const queryEmbedding = generatePlaceholderEmbedding();
    // Call database search function with account-based parameters
    const rpcClient = supabase;
    const { data: memories, error } = await rpcClient.rpc('search_account_memories', {
      p_account_id: accountId,
      p_user_id: userId,
      p_query_embedding: queryEmbedding,
      p_memory_types: memoryTypes || null,
      p_limit: limit,
      p_similarity_threshold: 0.5 // Lower threshold since using placeholder embeddings
    });
    if (error) {
      console.error('❌ Error searching memories:', error);
      throw new Error(`Failed to search memories: ${String(error)}`);
    }
    const memoryList = memories || [];
    console.log(`✅ Found ${memoryList.length} memories`);
    return {
      success: true,
      memories: memoryList,
      message: `Found ${memoryList.length} relevant memories`
    };
  } catch (error) {
    console.error('❌ Error in searchMemories:', error);
    return {
      success: false,
      error: String(error),
      message: `Failed to search memories: ${String(error)}`
    };
  }
}
