/*
  # Create Products and BOM Tables
  
  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name` (text)
      - `category` (text)
      - `description` (text)
      - `current_hpp` (decimal) - Current calculated HPP
      - `selling_price` (decimal)
      - `margin_percentage` (decimal)
      - `is_active` (boolean)
      - timestamps
    
    - `product_bom` (Bill of Materials)
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `raw_material_id` (uuid, references raw_materials)
      - `quantity` (decimal) - Quantity needed per product
      - timestamps
    
    - `product_additional_costs`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `cost_type` (text) - labor, overhead, packaging, etc
      - `cost_name` (text)
      - `amount` (decimal)
      - timestamps
    
    - `product_hpp_history`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `hpp_value` (decimal)
      - `material_cost` (decimal)
      - `additional_cost` (decimal)
      - `calculated_at` (timestamptz)
      - `notes` (text)
  
  2. Security
    - Enable RLS on all tables
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text,
  description text,
  current_hpp decimal(15,2) DEFAULT 0,
  selling_price decimal(15,2) DEFAULT 0,
  margin_percentage decimal(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS product_bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id uuid NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity decimal(15,4) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, raw_material_id)
);

ALTER TABLE product_bom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product_bom"
  ON product_bom FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product_bom"
  ON product_bom FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_bom"
  ON product_bom FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product_bom"
  ON product_bom FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS product_additional_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cost_type text NOT NULL CHECK (cost_type IN ('labor', 'overhead', 'packaging', 'other')),
  cost_name text NOT NULL,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_additional_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read additional_costs"
  ON product_additional_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert additional_costs"
  ON product_additional_costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update additional_costs"
  ON product_additional_costs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete additional_costs"
  ON product_additional_costs FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS product_hpp_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hpp_value decimal(15,2) NOT NULL,
  material_cost decimal(15,2) NOT NULL,
  additional_cost decimal(15,2) NOT NULL,
  calculated_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE product_hpp_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read hpp_history"
  ON product_hpp_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert hpp_history"
  ON product_hpp_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_bom_product ON product_bom(product_id);
CREATE INDEX idx_bom_material ON product_bom(raw_material_id);
CREATE INDEX idx_additional_costs_product ON product_additional_costs(product_id);
CREATE INDEX idx_hpp_history_product ON product_hpp_history(product_id);
CREATE INDEX idx_hpp_history_date ON product_hpp_history(calculated_at);
