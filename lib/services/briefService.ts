import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Brief, BriefInsert, BriefUpdate, BriefWithProduct } from '../supabase/types';

export interface BriefFilters {
  productId?: string;
  status?: 'draft' | 'complete' | 'archived' | 'all';
  limit?: number;
  offset?: number;
}

export const briefService = {
  // Fetch briefs with optional filters
  async getAll(filters: BriefFilters = {}): Promise<{ briefs: BriefWithProduct[]; total: number }> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return { briefs: [], total: 0 };
    }

    const { productId, status = 'all', limit = 50, offset = 0 } = filters;

    let query = supabase
      .from('briefs_with_products')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productId) {
      // Need to join with briefs table for product_id filter
      query = supabase
        .from('briefs')
        .select(`
          id,
          title,
          created_by,
          status,
          created_at,
          updated_at,
          completed_at,
          product_id,
          product_name_override,
          product:products(name, brand, market, category)
        `, { count: 'exact' })
        .eq('product_id', productId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      query = query.neq('status', 'archived');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching briefs:', error);
      throw error;
    }

    // Transform the data to match BriefWithProduct interface
    const briefs: BriefWithProduct[] = (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      created_by: item.created_by || null,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      completed_at: item.completed_at,
      product_name: item.product?.name || item.product_name_override || item.product_name || 'Unknown',
      brand: item.product?.brand || item.brand || 'Other',
      market: item.product?.market || item.market || null,
      category: item.product?.category || item.category || null,
      source_filename: item.source_filename || item.source_documents?.[0]?.filename || null,
      model_used: item.model_used || item.insights_data?.model_used || null,
    }));

    return { briefs, total: count || 0 };
  },

  // Get single brief with full data
  async getById(id: string): Promise<Brief & { product?: any }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('briefs')
      .select(`
        *,
        product:products(id, name, brand, market, category)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching brief:', error);
      throw error;
    }

    return data;
  },

  // Create new brief
  async create(brief: BriefInsert): Promise<Brief> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // Validate: either product_id or product_name_override required
    if (!brief.product_id && !brief.product_name_override) {
      throw new Error('Product selection required');
    }

    const insertData: BriefInsert = {
      ...brief,
      product_id: brief.product_id || null,
      product_name_override: brief.product_id ? null : brief.product_name_override,
      status: 'draft'
    };

    const { data, error } = await supabase
      .from('briefs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating brief:', error);
      throw error;
    }

    return data;
  },

  // Update brief (partial update)
  async update(id: string, updates: BriefUpdate): Promise<Brief> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // Set completed_at if status changing to complete
    if (updates.status === 'complete') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('briefs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating brief:', error);
      throw error;
    }

    return data;
  },

  // Archive brief (soft delete)
  async archive(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('briefs')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      console.error('Error archiving brief:', error);
      throw error;
    }
  },

  // Duplicate brief
  async duplicate(id: string): Promise<Brief> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // Get original brief
    const original = await this.getById(id);

    // Create copy
    const { data, error } = await supabase
      .from('briefs')
      .insert({
        product_id: original.product_id,
        product_name_override: original.product_name_override,
        title: `Copy of ${original.title}`,
        status: 'draft',
        source_documents: original.source_documents,
        insights_data: original.insights_data,
        selected_insight_id: original.selected_insight_id,
        marketing_summary: original.marketing_summary,
        pink_brief: original.pink_brief
      })
      .select()
      .single();

    if (error) {
      console.error('Error duplicating brief:', error);
      throw error;
    }

    return data;
  }
};
