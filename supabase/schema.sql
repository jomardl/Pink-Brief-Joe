-- P&G Pink Brief Architect - Database Schema
-- Run this in your Supabase SQL Editor to set up the required tables

-- ============================================
-- Products Table
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  market TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- ============================================
-- Briefs Table
-- ============================================

CREATE TABLE IF NOT EXISTS briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_override TEXT,
  title TEXT NOT NULL,
  created_by TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'archived')),
  source_documents JSONB DEFAULT '[]'::jsonb,
  insights_data JSONB,
  selected_insight_id INTEGER,
  marketing_summary JSONB,
  pink_brief JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Ensure either product_id OR product_name_override exists
  CONSTRAINT valid_product CHECK (
    product_id IS NOT NULL OR product_name_override IS NOT NULL
  )
);

-- Indexes for briefs
CREATE INDEX IF NOT EXISTS idx_briefs_product ON briefs(product_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_created ON briefs(created_at DESC);

-- ============================================
-- Auto-update updated_at Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to briefs table
DROP TRIGGER IF EXISTS briefs_updated_at ON briefs;
CREATE TRIGGER briefs_updated_at
  BEFORE UPDATE ON briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply trigger to products table
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- View: briefs_with_products
-- ============================================

CREATE OR REPLACE VIEW briefs_with_products AS
SELECT
  b.id,
  b.title,
  b.created_by,
  b.status,
  b.created_at,
  b.updated_at,
  b.completed_at,
  b.product_id,
  COALESCE(p.name, b.product_name_override, 'Unknown') AS product_name,
  COALESCE(p.brand, 'Other') AS brand,
  p.market,
  p.category
FROM briefs b
LEFT JOIN products p ON b.product_id = p.id
WHERE b.status != 'archived';

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Note: Enable RLS if you need per-user access control
-- For now, policies allow all authenticated users to access all data

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Public access policies (for anonymous/authenticated users)
-- Adjust these based on your security requirements

CREATE POLICY "Allow public read access to products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to products" ON products
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to briefs" ON briefs
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to briefs" ON briefs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to briefs" ON briefs
  FOR UPDATE USING (true);

-- ============================================
-- Sample Data (Optional)
-- ============================================

-- Uncomment below to insert sample products

-- INSERT INTO products (name, brand, market, category) VALUES
--   ('Always Platinum', 'Always', 'Global', 'Feminine Care'),
--   ('Always Radiant', 'Always', 'US', 'Feminine Care'),
--   ('Pampers Premium', 'Pampers', 'Global', 'Baby Care'),
--   ('Pampers Baby-Dry', 'Pampers', 'Global', 'Baby Care'),
--   ('Tide Pods', 'Tide', 'US', 'Fabric Care'),
--   ('Ariel Pods', 'Ariel', 'EMEA', 'Fabric Care');
