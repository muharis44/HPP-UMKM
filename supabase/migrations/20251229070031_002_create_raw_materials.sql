/*
  # Create Raw Materials Tables
  
  1. New Tables
    - `raw_materials`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Material code
      - `name` (text)
      - `unit` (text) - kg, liter, pcs, etc
      - `current_price` (decimal) - Current buy price
      - `min_stock` (decimal) - Minimum stock alert
      - `supplier_id` (uuid, references suppliers)
      - `description` (text)
      - `is_active` (boolean)
      - timestamps
    
    - `raw_material_price_history`
      - `id` (uuid, primary key)
      - `raw_material_id` (uuid, references raw_materials)
      - `old_price` (decimal)
      - `new_price` (decimal)
      - `changed_by` (uuid, references auth.users)
      - `changed_at` (timestamptz)
      - `notes` (text)
    
    - `raw_material_stock`
      - `id` (uuid, primary key)
      - `raw_material_id` (uuid, references raw_materials)
      - `quantity` (decimal)
      - `type` (text) - 'in' or 'out'
      - `reference` (text) - reference document
      - `notes` (text)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Admin and Staff can manage raw materials
*/

CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  current_price decimal(15,2) NOT NULL DEFAULT 0,
  current_stock decimal(15,3) NOT NULL DEFAULT 0,
  min_stock decimal(15,3) DEFAULT 0,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read raw_materials"
  ON raw_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert raw_materials"
  ON raw_materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update raw_materials"
  ON raw_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete raw_materials"
  ON raw_materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS raw_material_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id uuid NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  old_price decimal(15,2) NOT NULL,
  new_price decimal(15,2) NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE raw_material_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read price_history"
  ON raw_material_price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert price_history"
  ON raw_material_price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS raw_material_stock_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id uuid NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity decimal(15,3) NOT NULL,
  type text NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  reference text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE raw_material_stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stock_transactions"
  ON raw_material_stock_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock_transactions"
  ON raw_material_stock_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_raw_materials_code ON raw_materials(code);
CREATE INDEX idx_raw_materials_supplier ON raw_materials(supplier_id);
CREATE INDEX idx_price_history_material ON raw_material_price_history(raw_material_id);
CREATE INDEX idx_stock_transactions_material ON raw_material_stock_transactions(raw_material_id);
