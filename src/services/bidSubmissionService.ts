// =======================================================
// BID SUBMISSION API INTEGRATION
// Date: October 8, 2025
// Purpose: API functions to handle bid submission workflow
// =======================================================

import { createClient } from '@supabase/supabase-js';

/**
 * Submit a bid from form data
 * This function bridges the gap between form artifacts and actual bid records
 */
export async function submitBidFromForm(
  supabaseClient: any,
  params: {
    rfpId: number;
    artifactId: string;
    supplierId?: number;
    agentId?: number;
    sessionId?: string;
    userId?: string;
    formData?: any; // Optional form data override
  }
): Promise<{ success: boolean; bidId?: number; submissionId?: string; error?: string }> {
  try {
    console.log('Submitting bid from form:', params);

    // If form data is provided, save it to artifact first
    if (params.formData) {
      const { error: saveError } = await supabaseClient
        .from('artifacts')
        .update({
          default_values: params.formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.artifactId);

      if (saveError) {
        console.error('Error saving form data:', saveError);
        // Continue anyway, as the data might already be saved
      }
    }

    // Call the submit_bid database function
    const { data, error } = await supabaseClient.rpc('submit_bid', {
      rfp_id_param: params.rfpId,
      artifact_id_param: params.artifactId,
      supplier_id_param: params.supplierId || null,
      agent_id_param: params.agentId || null,
      session_id_param: params.sessionId || null,
      user_id_param: params.userId || null
    });

    if (error) {
      console.error('Error submitting bid:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No submission ID returned' };
    }

    // Get the created bid ID from the submission metadata
    const { data: submissionData, error: submissionError } = await supabaseClient
      .from('artifact_submissions')
      .select('metadata')
      .eq('id', data)
      .single();

    let bidId: number | undefined;
    if (submissionData?.metadata?.bid_id) {
      bidId = submissionData.metadata.bid_id;
    }

    console.log('Bid submitted successfully:', { bidId, submissionId: data });

    return {
      success: true,
      bidId,
      submissionId: data
    };

  } catch (error) {
    console.error('Exception in submitBidFromForm:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get bids for an RFP using edge function (bypasses PostgREST RLS issue)
 */
export async function getRfpBids(
  supabaseClient: any,
  rfpId: number
): Promise<{ success: boolean; bids?: any[]; error?: string }> {
  try {
    // Use edge function to bypass PostgREST RLS issues
    const { data, error } = await supabaseClient.functions.invoke('get-rfp-bids', {
      body: { rfp_id: rfpId }
    });

    if (error) {
      console.error('Error calling get-rfp-bids function:', error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      console.error('Error from get-rfp-bids function:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, bids: data?.bids || [] };

  } catch (error) {
    console.error('Exception in getRfpBids:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update bid status
 */
export async function updateBidStatus(
  supabaseClient: any,
  params: {
    bidId: number;
    status: string;
    statusReason?: string;
    reviewerId?: string;
    score?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.rpc('update_bid_status', {
      bid_id_param: params.bidId,
      new_status: params.status,
      status_reason_param: params.statusReason || null,
      reviewer_id_param: params.reviewerId || null,
      score_param: params.score || null
    });

    if (error) {
      console.error('Error updating bid status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Exception in updateBidStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract bid information from form data
 * Helper function to standardize form data extraction
 */
export function extractBidInfo(formData: any): {
  bidAmount?: number;
  deliveryDate?: string;
  supplierNotes?: string;
  companyName?: string;
  contactEmail?: string;
  phoneNumber?: string;
} {
  if (!formData || typeof formData !== 'object') {
    return {};
  }

  return {
    bidAmount: formData.bid_amount || formData.amount || formData.price || formData.cost,
    deliveryDate: formData.delivery_date || formData.deliveryDate || formData.delivery,
    supplierNotes: formData.notes || formData.comments || formData.additional_information,
    companyName: formData.company_name || formData.companyName || formData.supplier_name,
    contactEmail: formData.contact_email || formData.email || formData.supplier_email,
    phoneNumber: formData.phone_number || formData.phone || formData.contact_phone
  };
}

/**
 * Generate a summary of bid submission for Claude
 */
export function generateBidSubmissionSummary(
  bidResult: any,
  formData: any
): string {
  if (!bidResult.success) {
    return `❌ **Bid Submission Failed**: ${bidResult.error}`;
  }

  const extractedInfo = extractBidInfo(formData);
  
  return `✅ **Bid Successfully Submitted!**

📋 **Submission Details:**
- **Bid ID**: ${bidResult.bidId || 'Pending'}
- **Submission ID**: ${bidResult.submissionId}
- **Status**: Submitted
- **Submitted At**: ${new Date().toLocaleString()}

💰 **Bid Information:**${extractedInfo.bidAmount ? `
- **Amount**: $${extractedInfo.bidAmount.toLocaleString()}` : ''}${extractedInfo.deliveryDate ? `
- **Delivery Date**: ${extractedInfo.deliveryDate}` : ''}${extractedInfo.companyName ? `
- **Company**: ${extractedInfo.companyName}` : ''}${extractedInfo.contactEmail ? `
- **Contact**: ${extractedInfo.contactEmail}` : ''}

🎯 **Next Steps:**
- Bid is now visible in the Bids view
- RFP owner will be notified of the submission
- Bid status can be tracked through the system
- Evaluation and ranking will be conducted by the buyer`;
}