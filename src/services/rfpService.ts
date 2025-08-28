import { supabase } from '../supabaseClient';
import type { RFP, FormSpec, Bid } from '../types/rfp';

export class RFPService {
  static async getAll(): Promise<RFP[]> {
    const { data, error } = await supabase.from('rfp').select('*');
    if (error) return [];
    return data || [];
  }

  static async getById(id: number): Promise<RFP | null> {
    const { data, error } = await supabase.from('rfp').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async create(rfp: Partial<RFP>): Promise<RFP | null> {
    const { data, error } = await supabase.from('rfp').insert(rfp).select().single();
    if (error) return null;
    return data;
  }

  static async update(id: number, updates: Partial<RFP>): Promise<RFP | null> {
    const { data, error } = await supabase.from('rfp').update(updates).eq('id', id).select().single();
    if (error) return null;
    return data;
  }

  static async delete(id: number): Promise<boolean> {
    const { error } = await supabase.from('rfp').delete().eq('id', id);
    return !error;
  }

  // Form Spec Methods
  static async updateFormSpec(rfpId: number, formSpec: FormSpec): Promise<RFP | null> {
    return this.update(rfpId, { form_spec: formSpec });
  }

  static async getFormSpec(rfpId: number): Promise<FormSpec | null> {
    const rfp = await this.getById(rfpId);
    return rfp?.form_spec || null;
  }

  // Bid Methods
  static async createBid(bid: Partial<Bid>): Promise<Bid | null> {
    const { data, error } = await supabase.from('bid').insert(bid).select().single();
    if (error) return null;
    return data;
  }

  static async getBidsByRfp(rfpId: number): Promise<Bid[]> {
    const { data, error } = await supabase.from('bid').select('*').eq('rfp_id', rfpId);
    if (error) return [];
    return data || [];
  }

  static async updateBidResponse(bidId: number, response: Record<string, any>): Promise<Bid | null> {
    const { data, error } = await supabase.from('bid').update({ response }).eq('id', bidId).select().single();
    if (error) return null;
    return data;
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
}
