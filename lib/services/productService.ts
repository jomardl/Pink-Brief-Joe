import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Product, ProductInsert } from '../supabase/types';

export const productService = {
  // Fetch all active products
  async getAll(): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('brand')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  },

  // Get products grouped by brand
  async getGroupedByBrand(): Promise<Record<string, Product[]>> {
    const products = await this.getAll();
    return products.reduce((acc, product) => {
      if (!acc[product.brand]) {
        acc[product.brand] = [];
      }
      acc[product.brand].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  },

  // Get unique brands
  async getBrands(): Promise<string[]> {
    const products = await this.getAll();
    return [...new Set(products.map(p => p.brand))] as string[];
  },

  // Create new product
  async create(product: ProductInsert): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('products')
      .insert(product as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Product already exists');
      }
      console.error('Error creating product:', error);
      throw error;
    }

    return data as Product;
  },

  // Check if product name exists
  async nameExists(name: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const { data, error } = await supabase
      .from('products')
      .select('id')
      .ilike('name', name)
      .limit(1);

    if (error) {
      console.error('Error checking product name:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  },

  // Update product
  async update(id: string, updates: Partial<ProductInsert>): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return data as Product;
  },

  // Soft delete product
  async archive(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await (supabase as any)
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error archiving product:', error);
      throw error;
    }
  }
};
