// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../supabaseClient';
import type { RFP, FormSpec, Bid } from '../types/rfp';

// Type for buyer questionnaire structure
export interface BuyerQuestionnaire {
  questions: Array<{
    id: string;
    type: string;
    question: string;
    required?: boolean;
    options?: string[];
  }>;
  metadata?: Record<string, unknown>;
}

// Type for buyer questionnaire response
export interface BuyerQuestionnaireResponse {
  default_values: Record<string, unknown>;
  supplier_info: {
    name: string;
    email: string;
    [key: string]: unknown;
  };
  submitted_at?: string;
  form_version?: string;
  generated_at?: string;
  bid_id?: number;
}

export class RFPService {
  // Check if the new schema is available
  private static async checkSchemaCompatibility(): Promise<{ hasSpecificationField: boolean }> {
    try {
      // Try to select the specification field - if it fails, the field doesn't exist
      const { error } = await supabase
        .from('rfps')
        .select('specification')
        .limit(1);
      
      return { hasSpecificationField: !error };
    } catch {
      return { hasSpecificationField: false };
    }
  }

  static async getAll(): Promise<RFP[]> {
    console.log('🔄 Fetching all RFPs...');
    
    try {
      const compatibility = await this.checkSchemaCompatibility();
      console.log('📋 Schema compatibility check:', compatibility);
      
      const { data, error } = await supabase.from('rfps').select('*');
      
      if (error) {
        console.error('❌ Supabase error fetching RFPs:', JSON.stringify(error, null, 2));
        return [];
      }
      
      console.log('✅ Fetched RFPs successfully:', data?.length || 0, 'records');
      
      // Transform data to ensure compatibility between old and new schemas
      const transformedData = (data || []).map(item => ({
        ...item,
        description: item.description || '',
        specification: compatibility.hasSpecificationField 
          ? (item.specification || item.description || '') 
          : (item.description || ''),
      }));
      
      return transformedData;
    } catch (error) {
      console.error('❌ Exception in getAll:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<RFP | null> {
    const { data, error } = await supabase.from('rfps').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async create(rfp: Partial<RFP>): Promise<RFP | null> {
    console.log('🔄 Creating RFP with data:', JSON.stringify(rfp, null, 2));
    
    try {
      const compatibility = await this.checkSchemaCompatibility();
      console.log('📋 Schema compatibility for create:', compatibility);
      
      // Prepare data based on schema compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let insertData: any = { ...rfp };
      
      if (!compatibility.hasSpecificationField) {
        // Old schema - only use description field
        insertData = {
          ...rfp,
          description: rfp.description || rfp.specification || '',
          // Ensure optional fields have defaults
          suppliers: rfp.suppliers || [],
          agent_ids: rfp.agent_ids || [],
          is_template: rfp.is_template || false,
          is_public: rfp.is_public || false
        };
        // Remove specification field if it exists since the column doesn't exist
        delete insertData.specification;
      } else {
        // New schema - ensure both required fields exist
        insertData = {
          ...rfp,
          description: rfp.description || '',
          specification: rfp.specification || '',
          // Ensure optional fields have defaults
          suppliers: rfp.suppliers || [],
          agent_ids: rfp.agent_ids || [],
          is_template: rfp.is_template || false,
          is_public: rfp.is_public || false
        };
      }
      
      // Remove any undefined values and document field if present
      Object.keys(insertData).forEach(key => {
        if (insertData[key] === undefined || key === 'document') {
          delete insertData[key];
        }
      });
      
      console.log('📝 Prepared insert data:', JSON.stringify(insertData, null, 2));
      
      const { data, error } = await supabase.from('rfps').insert(insertData).select().single();
      
      if (error) {
        console.error('❌ Supabase error creating RFP:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        return null;
      }
      
      console.log('✅ RFP created successfully:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('❌ Exception in create:', error);
      return null;
    }
  }

  static async update(id: number, updates: Partial<RFP>): Promise<RFP | null> {
    // Validate RFP ID
    if (!id || id <= 0) {
      console.warn('⚠️ Invalid RFP ID for update:', id);
      return null;
    }

    console.log('🔄 Updating RFP', id, 'with data:', JSON.stringify(updates, null, 2));
    
    try {
      const compatibility = await this.checkSchemaCompatibility();
      console.log('📋 Schema compatibility for update:', compatibility);
      
      // Prepare update data based on schema compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updateData: any = { ...updates };
      
      if (!compatibility.hasSpecificationField) {
        // Old schema - only use description field
        updateData = {
          ...updates,
          description: updates.description || updates.specification || ''
        };
        // Remove specification field if it exists since the column doesn't exist
        delete updateData.specification;
      } else {
        // New schema - ensure both fields exist if provided
        updateData = {
          ...updates,
          description: updates.description !== undefined ? updates.description : undefined,
          specification: updates.specification !== undefined ? updates.specification : undefined
        };
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });
      }
      
      console.log('📝 Prepared update data:', JSON.stringify(updateData, null, 2));
      
      const { data, error } = await supabase.from('rfps').update(updateData).eq('id', id).select().single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('⚠️ RFP not found or no permission to update RFP:', id);
        } else {
          console.error('❌ Supabase error updating RFP:', JSON.stringify(error, null, 2));
        }
        return null;
      }
      
      console.log('✅ RFP updated successfully:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('❌ Exception in update:', error);
      return null;
    }
  }

  static async delete(id: number): Promise<boolean> {
    const { error } = await supabase.from('rfps').delete().eq('id', id);
    return !error;
  }

  // Form Spec Methods
  static async updateFormSpec(rfpId: number, formSpec: FormSpec): Promise<RFP | null> { 
    return this.update(rfpId, { bid_form_questionaire: formSpec });
  }

  static async getFormSpec(rfpId: number): Promise<FormSpec | null> {
    const rfp = await this.getById(rfpId);
    return rfp?.bid_form_questionaire || null;
  }  // Bid Methods
  static async createBid(bid: Partial<Bid>): Promise<Bid | null> {
    console.log('🔄 Creating bid with data:', JSON.stringify(bid, null, 2));
    
    // Extract supplier info from bid response to auto-create supplier profile if needed
    let supplierId = bid.supplier_id;
    
    if (!supplierId && bid.response && typeof bid.response === 'object') {
      const response = bid.response as Record<string, unknown>;
      const supplierInfo = response.supplier_info as Record<string, unknown> | undefined;
      
      if (supplierInfo && supplierInfo.email) {
        console.log('🔍 Checking for existing supplier profile with email:', supplierInfo.email);
        
        // Check if supplier profile already exists for this email
        const { data: existingSupplier } = await supabase
          .from('supplier_profiles')
          .select('id')
          .eq('email', supplierInfo.email)
          .single();
        
        if (existingSupplier) {
          console.log('✅ Found existing supplier profile:', existingSupplier.id);
          supplierId = existingSupplier.id;
        } else {
          // Create new supplier profile
          console.log('🆕 Creating new supplier profile for:', supplierInfo.email);
          const supplierData = {
            name: supplierInfo.name || 'Unknown Supplier',
            email: supplierInfo.email,
            description: supplierInfo.company ? `Company: ${supplierInfo.company}` : null,
            phone: supplierInfo.phone || null
          };
          
          const { data: newSupplier, error: supplierError } = await supabase
            .from('supplier_profiles')
            .insert(supplierData)
            .select('id')
            .single();
          
          if (supplierError) {
            console.error('❌ Error creating supplier profile:', supplierError);
            // Continue with bid creation even if supplier profile creation fails
          } else {
            console.log('✅ Created supplier profile with ID:', newSupplier.id);
            supplierId = newSupplier.id;
          }
        }
      }
    }
    
    // Create the bid with supplier_id if we have one
    const bidDataWithSupplier = { ...bid };
    if (supplierId) {
      bidDataWithSupplier.supplier_id = supplierId;
    }
    
    const { data, error } = await supabase.from('bids').insert(bidDataWithSupplier).select().single();
    if (error) {
      console.error('❌ Supabase error creating bid:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return null;
    }
    console.log('✅ Bid created successfully:', JSON.stringify(data, null, 2));
    return data;
  }

  static async getBidsByRfp(rfpId: number): Promise<Bid[]> {
    const { data, error } = await supabase.from('bids').select('*').eq('rfp_id', rfpId);
    if (error) return [];
    return data || [];
  }

  static async updateBidResponse(bidId: number, response: Record<string, unknown>): Promise<Bid | null> {
    const { data, error } = await supabase.from('bids').update({ response }).eq('id', bidId).select().single();
    if (error) return null;
    return data;
  }

  // Submit bid response using artifact submission (new schema)
  static async submitBidAsArtifact(
    bidId: number, 
    submissionData: Record<string, unknown>,
    sessionId?: string,
    userId?: string
  ): Promise<Bid | null> {
    try {
      // Get the bid to find the RFP and bid form artifact
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .select('rfp_id, supplier_id')
        .eq('id', bidId)
        .single();

      if (bidError || !bid) {
        console.error('❌ Error fetching bid:', bidError);
        return null;
      }

      // Find the bid form artifact for this RFP
      const { data: rfpArtifacts, error: artifactError } = await supabase
        .from('rfp_artifacts')
        .select('artifact_id, artifacts!inner(*)')
        .eq('rfp_id', bid.rfp_id)
        .eq('role', 'supplier')
        .eq('artifacts.artifact_role', 'bid_form')
        .limit(1);

      if (artifactError || !rfpArtifacts?.length) {
        console.error('❌ Error finding bid form artifact:', artifactError);
        return null;
      }

      const bidFormArtifactId = rfpArtifacts[0].artifact_id;

      // Create artifact submission
      const { data: submission, error: submissionError } = await supabase
        .from('artifact_submissions')
        .insert({
          artifact_id: bidFormArtifactId,
          session_id: sessionId || null,
          user_id: userId || bid.supplier_id,
          submission_data: submissionData,
          submitted_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (submissionError || !submission) {
        console.error('❌ Error creating artifact submission:', submissionError);
        return null;
      }

      // Update bid to reference the artifact submission
      const { data: updatedBid, error: updateError } = await supabase
        .from('bids')
        .update({ artifact_submission_id: submission.id })
        .eq('id', bidId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating bid with submission reference:', updateError);
        return null;
      }

      console.log('✅ Bid submitted as artifact submission:', submission.id);
      return updatedBid;
    } catch (error) {
      console.error('❌ Error in submitBidAsArtifact:', error);
      return null;
    }
  }

  // Get bid response data (supports both legacy and new schema)
  static async getBidResponse(bidId: number): Promise<Record<string, unknown> | null> {
    try {
      // First try to get from artifact submission (new schema)
      const { data: bidWithSubmission, error: bidError } = await supabase
        .from('bids')
        .select(`
          *,
          artifact_submissions!inner(submission_data)
        `)
        .eq('id', bidId)
        .single();

      if (!bidError && bidWithSubmission?.artifact_submissions?.submission_data) {
        return bidWithSubmission.artifact_submissions.submission_data;
      }

      // Fallback to legacy response field
      const { data: bid, error: legacyError } = await supabase
        .from('bids')
        .select('response')
        .eq('id', bidId)
        .single();

      if (legacyError || !bid) {
        console.error('❌ Error fetching bid response:', legacyError);
        return null;
      }

      return bid.response || null;
    } catch (error) {
      console.error('❌ Error in getBidResponse:', error);
      return null;
    }
  }

  // Generate signed URL for bid submission (this would typically be done server-side)
  static generateBidSubmissionUrl(rfpId: number, supplierInfo?: { name?: string; email?: string }): string {
    // In a real implementation, this would create a signed JWT token
    // For now, we'll create a simple URL with query parameters
    const params = new URLSearchParams({
      rfp_id: rfpId.toString(),
      ...(supplierInfo?.name && { supplier_name: supplierInfo.name }),
      ...(supplierInfo?.email && { supplier_email: supplierInfo.email }),
      timestamp: Date.now().toString()
    });
    
    return `/bid/submit?${params.toString()}`;
  }

  // Validate form spec structure
  static validateFormSpec(formSpec: FormSpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formSpec.version) {
      errors.push('Form spec must have a version');
    }

    if (!formSpec.schema || typeof formSpec.schema !== 'object') {
      errors.push('Form spec must have a valid schema object');
    }

    if (!formSpec.uiSchema || typeof formSpec.uiSchema !== 'object') {
      errors.push('Form spec must have a valid uiSchema object');
    }

    if (formSpec.schema) {
      if (!formSpec.schema.type) {
        errors.push('Schema must have a type');
      }

      if (formSpec.schema.type === 'object' && !formSpec.schema.properties) {
        errors.push('Object schema must have properties');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Request Methods
  static async updateRfpRequest(rfpId: number, request: string): Promise<RFP | null> {
    // Validate RFP ID
    if (!rfpId || rfpId <= 0) {
      console.warn('⚠️ Invalid RFP ID for update:', rfpId);
      return null;
    }

    console.log('🔄 Updating RFP request for ID:', rfpId);
    const { data, error } = await supabase
      .from('rfps')
      .update({ request })
      .eq('id', rfpId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('⚠️ RFP not found or no permission to update RFP:', rfpId);
      } else {
        console.error('❌ Error updating RFP request:', error);
      }
      return null;
    }
    
    console.log('✅ RFP request updated successfully');
    return data;
  }

  static async updateRfpBuyerQuestionnaire(
    rfpId: number, 
    questionnaire: BuyerQuestionnaire
  ): Promise<RFP | null> {
    console.log('🔄 Updating RFP buyer questionnaire for ID:', rfpId);
    
    try {
      // First try the new schema approach - create/update as an artifact
      const artifactData = {
        id: `buyer_questionnaire_${rfpId}`,
        name: 'Buyer Questionnaire',
        type: 'questionnaire' as const,
        form_spec: questionnaire,
        role: 'buyer' as const,
        created_at: new Date().toISOString()
      };

      // Try to save as artifact first (new schema)
      const { error: artifactError } = await supabase
        .from('artifacts')
        .upsert(artifactData);

      if (!artifactError) {
        // Link to RFP if not already linked
        const { error: linkError } = await supabase
          .from('rfp_artifacts')
          .upsert({
            rfp_id: rfpId,
            artifact_id: artifactData.id,
            role: 'buyer'
          });

        if (!linkError) {
          console.log('✅ RFP buyer questionnaire saved as artifact');
          // Return the RFP data
          const { data: rfpData } = await supabase
            .from('rfps')
            .select()
            .eq('id', rfpId)
            .single();
          return rfpData;
        }
      }

      // Fallback to old schema if new schema fails
      console.log('🔄 Falling back to legacy questionnaire storage');
      const { data, error } = await supabase
        .from('rfps')
        .update({ buyer_questionnaire: questionnaire })
        .eq('id', rfpId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating RFP buyer questionnaire:', error);
        return null;
      }
      
      console.log('✅ RFP buyer questionnaire updated successfully (legacy)');
      return data;
    } catch (err) {
      console.error('❌ Exception updating buyer questionnaire:', err);
      return null;
    }
  }

  static async updateRfpBuyerQuestionnaireResponse(
    rfpId: number, 
    response: BuyerQuestionnaireResponse
  ): Promise<RFP | null> {
    console.log('🔄 Updating RFP buyer questionnaire response for ID:', rfpId);
    
    try {
      // First try the new schema approach - create/update as an artifact submission
      const submissionData = {
        default_values: response.default_values,
        supplier_info: response.supplier_info,
        submitted_at: response.submitted_at || new Date().toISOString(),
        form_version: response.form_version,
        generated_at: response.generated_at,
        bid_id: response.bid_id
      };

      // Look for the buyer questionnaire artifact for this RFP
      const { data: artifactData, error: artifactError } = await supabase
        .from('rfp_artifacts')
        .select('artifact_id')
        .eq('rfp_id', rfpId)
        .eq('role', 'buyer')
        .limit(1);

      if (artifactError) {
        console.error('❌ Error querying rfp_artifacts:', artifactError);
        return null;
      }

      const artifact = artifactData?.[0];
      if (artifact?.artifact_id) {
        // Save as artifact submission (new schema)
        const { error: submissionError } = await supabase
          .from('artifact_submissions')
          .upsert({
            artifact_id: artifact.artifact_id,
            submission_data: submissionData,
            user_id: response.supplier_info?.user_id || null,
            session_id: response.supplier_info?.session_id || null,
            submitted_at: submissionData.submitted_at
          });

        if (!submissionError) {
          console.log('✅ RFP buyer questionnaire response saved as artifact submission');
          // Return the RFP data  
          const { data: rfpData } = await supabase
            .from('rfps')
            .select()
            .eq('id', rfpId)
            .single();
          return rfpData;
        } else {
          console.error('❌ Error saving artifact submission:', submissionError);
          return null;
        }
      }

      // No buyer questionnaire artifact found for this RFP
      console.log('❌ No buyer questionnaire artifact found for RFP ID:', rfpId);
      console.log('💡 A buyer questionnaire artifact must be created before responses can be saved');
      return null;
    } catch (err) {
      console.error('❌ Exception updating buyer questionnaire response:', err);
      return null;
    }
  }

  static async getRfpBuyerQuestionnaire(rfpId: number): Promise<BuyerQuestionnaire | null> {
    console.log('🔄 Getting RFP buyer questionnaire for ID:', rfpId);
    
    try {
      // First try the new schema approach - look for questionnaire artifact
      const { data: artifactData } = await supabase
        .from('rfp_artifacts')
        .select(`
          artifact_id,
          artifacts!inner(
            id,
            name,
            type,
            form_spec
          )
        `)
        .eq('rfp_id', rfpId)
        .eq('role', 'buyer')
        .eq('artifacts.type', 'questionnaire')
        .limit(1)
        .single();

      if (artifactData?.artifacts && Array.isArray(artifactData.artifacts) && artifactData.artifacts.length > 0) {
        console.log('✅ Found buyer questionnaire as artifact');
        return artifactData.artifacts[0].form_spec as BuyerQuestionnaire;
      }

      // Fallback to old schema if new schema doesn't have data
      console.log('🔄 Falling back to legacy questionnaire retrieval');
      const { data: rfpData } = await supabase
        .from('rfps')
        .select('buyer_questionnaire')
        .eq('id', rfpId)
        .single();
      
      if (rfpData?.buyer_questionnaire) {
        console.log('✅ Found buyer questionnaire in legacy format');
        return rfpData.buyer_questionnaire as BuyerQuestionnaire;
      }

      console.log('📋 No buyer questionnaire found for RFP:', rfpId);
      return null;
    } catch (err) {
      console.error('❌ Exception getting buyer questionnaire:', err);
      return null;
    }
  }

  static async getRfpBuyerQuestionnaireResponse(rfpId: number): Promise<BuyerQuestionnaireResponse | null> {
    console.log('🔄 Getting RFP buyer questionnaire response for ID:', rfpId);
    
    try {
      // First try the new schema approach - look for questionnaire response submission
      const { data: artifactData, error: artifactError } = await supabase
        .from('rfp_artifacts')
        .select('artifact_id')
        .eq('rfp_id', rfpId)
        .eq('role', 'buyer')
        .limit(1);

      if (artifactError) {
        console.error('❌ Error querying rfp_artifacts:', artifactError);
        return null;
      }

      const artifact = artifactData?.[0];
      if (artifact?.artifact_id) {
        const { data: submissionData, error: submissionError } = await supabase
          .from('artifact_submissions')
          .select('submission_data, submitted_at')
          .eq('artifact_id', artifact.artifact_id)
          .order('submitted_at', { ascending: false })
          .limit(1);

        if (submissionError) {
          console.error('❌ Error querying artifact_submissions:', submissionError);
          return null;
        }

        const latestSubmission = submissionData?.[0];
        if (latestSubmission?.submission_data) {
          console.log('✅ Found buyer questionnaire response as artifact submission');
          return latestSubmission.submission_data as BuyerQuestionnaireResponse;
        }
      }

      // No buyer questionnaire artifact found or no submissions
      console.log('📋 No buyer questionnaire response found for RFP:', rfpId);
      console.log('� A buyer questionnaire artifact and submission must exist for this RFP');
      return null;
    } catch (err) {
      console.error('❌ Exception getting buyer questionnaire response:', err);
      return null;
    }
  }

  // Generate a request for proposal based on bid data and RFP information
  static async generateRequest(
    rfp: RFP, 
    bidData: Record<string, unknown>, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _supplierInfo: { name: string; email: string; company?: string }
  ): Promise<string> {
    // This is a mock implementation - in reality this would call Claude API
    // to generate a comprehensive request for proposal based on the RFP spec and bid data
    
    // Generate the bid form URL using the same route as the RFP Design Agent
    const bidFormUrl = `/rfp/${rfp.id}/bid`;
    
    const requestText = `
# Request for Proposal: ${rfp.name}

## Executive Summary
This is a request for proposal (RFP) for "${rfp.name}". We are seeking qualified suppliers to submit bids for this procurement opportunity.

**IMPORTANT: Bid Submission**
To submit your bid for this RFP, please access our [Bid Submission Form](${bidFormUrl})

## Project Overview
${rfp.description}

## Detailed Requirements
${rfp.specification}

## Submission Instructions
Please submit your bid through our online bid form. Your response should address all requirements outlined in this RFP.

**How to Submit Your Bid:**
1. Review all requirements above
2. Access our online [Bid Submission Form](${bidFormUrl})
3. Complete all required fields
4. Submit before the deadline: ${new Date(rfp.due_date).toLocaleDateString()}

### Required Information
${this.formatBidDataForRequest(bidData)}

### Timeline and Deliverables
Proposals must be submitted by: ${new Date(rfp.due_date).toLocaleDateString()}

## Evaluation Criteria
Proposals will be evaluated based on:
- Technical capability and approach
- Cost effectiveness
- Timeline and delivery schedule
- Company qualifications and experience

## Contact Information
For questions about this RFP, please contact us through the RFPEZ.AI platform.

**Important Links:**
- [Bid Submission Form](${bidFormUrl})

---
*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
`;

    return requestText.trim();
  }

  // Helper method to format bid data for inclusion in request
  private static formatBidDataForRequest(bidData: Record<string, unknown>): string {
    const entries = Object.entries(bidData);
    if (entries.length === 0) {
      return 'No specific bid details provided.';
    }

    let formatted = '';
    entries.forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (Array.isArray(value)) {
          formatted += `- **${label}:** ${value.join(', ')}\n`;
        } else if (typeof value === 'object') {
          formatted += `- **${label}:** ${JSON.stringify(value, null, 2)}\n`;
        } else {
          formatted += `- **${label}:** ${value}\n`;
        }
      }
    });

    return formatted || 'No specific bid details provided.';
  }

  // Find bid form artifact for an RFP
  static async getBidFormForRfp(rfpId: number): Promise<FormSpec | null> {
    try {
      console.log('🔍 Looking for bid form for RFP ID:', rfpId);

      // First, try the new schema with rfp_artifacts junction table
      const { data: rfpArtifacts, error: rfpArtifactError } = await supabase
        .from('rfp_artifacts')
        .select('artifact_id, artifacts!inner(*)')
        .eq('rfp_id', rfpId)
        .eq('artifact_role', 'bid_form')
        .order('created_at', { ascending: false });

      if (rfpArtifactError) {
        console.warn('Error querying rfp_artifacts table:', rfpArtifactError);
      } else if (rfpArtifacts && rfpArtifacts.length > 0) {
        console.log('✅ Found bid form via rfp_artifacts table');
        const bidFormArtifact = (rfpArtifacts[0] as any).artifacts;
        console.log('Found bid form artifact:', bidFormArtifact.name, 'for RFP:', rfpId);

        // Extract the form specification from the artifact
        return this.extractFormSpecFromArtifact(bidFormArtifact);
      }

      // Fallback to legacy approach for backwards compatibility
      console.log('⚠️ No bid form found via rfp_artifacts, trying legacy name-based search');
      
      // First, get the RFP to get its name for pattern matching
      const rfp = await this.getById(rfpId);
      if (!rfp) {
        console.error('RFP not found:', rfpId);
        return null;
      }

      // Query for bid form artifacts that could be associated with this RFP
      // Strategy 1: Look for bid forms with matching name patterns
      const rfpNameWords = rfp.name.toLowerCase().split(' ');
      const searchPattern = rfpNameWords.slice(0, 2).join(' '); // Use first 2 words for matching

      const { data: artifacts, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('artifact_role', 'bid_form')
        .ilike('name', `%${searchPattern}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error querying for bid form artifacts:', error);
        return null;
      }

      if (!artifacts || artifacts.length === 0) {
        console.warn(`No bid form found for RFP ${rfpId} (${rfp.name})`);
        return null;
      }

      // Use the most recent matching bid form
      const bidFormArtifact = artifacts[0];
      console.log('Found bid form artifact via legacy search:', bidFormArtifact.name, 'for RFP:', rfp.name);
      
      return this.extractFormSpecFromArtifact(bidFormArtifact);
    } catch (error) {
      console.error('Error finding bid form for RFP:', error);
      return null;
    }
  }

  // Helper method to extract FormSpec from artifact data
  private static extractFormSpecFromArtifact(bidFormArtifact: any): FormSpec {
    // Extract the form specification from the artifact
    // The schema might be in the schema field or in processed_content
    let formSpec: FormSpec;
    
    if (bidFormArtifact.processed_content) {
      try {
        const processedData = JSON.parse(bidFormArtifact.processed_content);
        formSpec = {
          schema: processedData.schema || bidFormArtifact.schema || {},
          uiSchema: processedData.ui_schema || bidFormArtifact.ui_schema || {},
          defaults: processedData.form_data || bidFormArtifact.form_data || {},
          version: '1.0'
        };
        console.log('✅ Extracted form spec from processed_content');
      } catch (error) {
        console.warn('Failed to parse processed_content, falling back to direct fields');
        formSpec = {
          schema: bidFormArtifact.schema || {},
          uiSchema: bidFormArtifact.ui_schema || {},
          defaults: bidFormArtifact.form_data || {},
          version: '1.0'
        };
      }
    } else {
      formSpec = {
        schema: bidFormArtifact.schema || {},
        uiSchema: bidFormArtifact.ui_schema || {},
        defaults: bidFormArtifact.form_data || {},
        version: '1.0'
      };
    }

    return formSpec;
  }
}
