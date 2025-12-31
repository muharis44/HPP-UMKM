-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create raw_materials table
CREATE TABLE IF NOT EXISTS raw_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  supplier_id INT,
  unit VARCHAR(50) NOT NULL,
  purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(15, 2) DEFAULT 0,
  current_stock DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) NOT NULL,
  selling_price DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create bill_of_materials (BOM) table
CREATE TABLE IF NOT EXISTS bill_of_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  raw_material_id INT NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_material (product_id, raw_material_id)
);

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create units_of_measurement table
CREATE TABLE IF NOT EXISTS units_of_measurement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default units
INSERT INTO units_of_measurement (name, abbreviation, category) VALUES
('Kilogram', 'kg', 'weight'),
('Gram', 'g', 'weight'),
('Liter', 'L', 'volume'),
('Milliliter', 'mL', 'volume'),
('Piece', 'pcs', 'quantity'),
('Pack', 'pack', 'quantity'),
('Box', 'box', 'quantity'),
('Meter', 'm', 'length'),
('Centimeter', 'cm', 'length')
ON DUPLICATE KEY UPDATE name = name;

-- Create indexes for better performance
CREATE INDEX idx_raw_materials_supplier ON raw_materials(supplier_id);
CREATE INDEX idx_bom_product ON bill_of_materials(product_id);
CREATE INDEX idx_bom_material ON bill_of_materials(raw_material_id);
CREATE INDEX idx_products_category ON products(category);
