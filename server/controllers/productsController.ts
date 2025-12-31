import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [products]: any = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [bom] = await pool.query(`
      SELECT bom.*, rm.name as raw_material_name, rm.sku as raw_material_sku, rm.purchase_price
      FROM bill_of_materials bom
      JOIN raw_materials rm ON bom.raw_material_id = rm.id
      WHERE bom.product_id = ?
    `, [id]);

    res.json({ ...products[0], bom });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unit, selling_price, description, bom } = req.body;

    const [result]: any = await pool.query(
      'INSERT INTO products (name, sku, category, unit, selling_price, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, sku, category, unit, selling_price || 0, description]
    );

    const productId = result.insertId;

    if (bom && bom.length > 0) {
      for (const item of bom) {
        await pool.query(
          'INSERT INTO bill_of_materials (product_id, raw_material_id, quantity, unit) VALUES (?, ?, ?, ?)',
          [productId, item.raw_material_id, item.quantity, item.unit]
        );
      }
    }

    res.json({ id: productId, name, sku, category, unit, selling_price, description });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unit, selling_price, description, bom } = req.body;

    await pool.query(
      'UPDATE products SET name = ?, sku = ?, category = ?, unit = ?, selling_price = ?, description = ? WHERE id = ?',
      [name, sku, category, unit, selling_price, description, id]
    );

    if (bom) {
      await pool.query('DELETE FROM bill_of_materials WHERE product_id = ?', [id]);

      for (const item of bom) {
        await pool.query(
          'INSERT INTO bill_of_materials (product_id, raw_material_id, quantity, unit) VALUES (?, ?, ?, ?)',
          [id, item.raw_material_id, item.quantity, item.unit]
        );
      }
    }

    res.json({ id, name, sku, category, unit, selling_price, description });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const calculateHPP = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [bom]: any = await pool.query(`
      SELECT bom.quantity, rm.purchase_price
      FROM bill_of_materials bom
      JOIN raw_materials rm ON bom.raw_material_id = rm.id
      WHERE bom.product_id = ?
    `, [id]);

    let hpp = 0;
    for (const item of bom) {
      hpp += item.quantity * item.purchase_price;
    }

    res.json({ hpp });
  } catch (error) {
    console.error('Calculate HPP error:', error);
    res.status(500).json({ error: 'Failed to calculate HPP' });
  }
};
