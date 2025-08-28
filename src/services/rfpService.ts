import { supabase } from '../supabaseClient';
import type { RFP } from '../types/rfp';

export class RFPService {
  static async getAll(): Promise<RFP[]> {
    const { data, error } = await supabase.from('rfp').select('*');
    if (error) return [];
    return data || [];
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
}
