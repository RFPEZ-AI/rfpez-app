import { supabase } from '../supabaseClient';
import type { RFP, FormSpec, Bid } from '../types/rfp';

export class RFPService {
  // Check if the new schema is available
  private static async checkSchemaCompatibility(): Promise<{ hasSpecificationField: boolean }> {
    try {
      // Try to select the specification field - if it fails, the field doesn't exist
      const { error } = await supabase
        .from('rfp')
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
      
      const { data, error } = await supabase.from('rfp').select('*');
      
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
    const { data, error } = await supabase.from('rfp').select('*').eq('id', id).single();
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
      
      const { data, error } = await supabase.from('rfp').insert(insertData).select().single();
      
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
      
      const { data, error } = await supabase.from('rfp').update(updateData).eq('id', id).select().single();
      
      if (error) {
        console.error('❌ Supabase error updating RFP:', JSON.stringify(error, null, 2));
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
    console.log('🔄 Creating bid with data:', JSON.stringify(bid, null, 2));
    const { data, error } = await supabase.from('bid').insert(bid).select().single();
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
    const { data, error } = await supabase.from('bid').select('*').eq('rfp_id', rfpId);
    if (error) return [];
    return data || [];
  }

  static async updateBidResponse(bidId: number, response: Record<string, unknown>): Promise<Bid | null> {
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
