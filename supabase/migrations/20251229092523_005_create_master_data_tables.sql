/*
  # Create Master Data Tables for Units and Categories
  
  1. New Tables
    - `units`
      - `id` (uuid, primary key)
      - `name` (text) - Display name like "Kilogram"
      - `symbol` (text) - Symbol like "kg"
      - `is_active` (boolean)
      - timestamps
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `is_active` (boolean)
      - timestamps
  
  2. Security
    - Enable RLS on both tables
    - Authenticated users can read
    - Authenticated users can insert (for add from dropdown)
    - Admin can update/delete
  
  3. Seed Data
    - Common units
    - Common categories
*/

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  symbol text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read units"
  ON units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert units"
  ON units FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update units"
  ON units FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete units"
  ON units FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

INSERT INTO units (name, symbol) VALUES
  ('Kilogram', 'kg'),
  ('Gram', 'g'),
  ('Liter', 'liter'),
  ('Mililiter', 'ml'),
  ('Pieces', 'pcs'),
  ('Pack', 'pack'),
  ('Box', 'box'),
  ('Meter', 'm'),
  ('Centimeter', 'cm'),
  ('Lusin', 'lusin')
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO categories (name, description) VALUES
  ('Makanan', 'Produk makanan'),
  ('Minuman', 'Produk minuman'),
  ('Snack', 'Makanan ringan'),
  ('Frozen Food', 'Makanan beku'),
  ('Kue & Roti', 'Produk bakery'),
  ('Bumbu & Saus', 'Bumbu masakan dan saus'),
  ('Lainnya', 'Kategori lainnya')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX idx_units_symbol ON units(symbol);
CREATE INDEX idx_categories_name ON categories(name);
