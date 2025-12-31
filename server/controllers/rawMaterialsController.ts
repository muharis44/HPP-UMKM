import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getRawMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const [materials] = await pool.query(`
      SELECT rm.*, s.name as supplier_name
      FROM raw_materials rm
      LEFT JOIN suppliers s ON rm.supplier_id = s.id
      ORDER BY rm.name
    `);
    res.json(materials);
  } catch (error) {
    console.error('Get raw materials error:', error);
    res.status(500).json({ error: 'Failed to get raw materials' });
  }
};

export const getRawMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [materials]: any = await pool.query(`
      SELECT rm.*, s.name as supplier_name
      FROM raw_materials rm
      LEFT JOIN suppliers s ON rm.supplier_id = s.id
      WHERE rm.id = ?
    `, [id]);

    if (materials.length === 0) {
      return res.status(404).json({ error: 'Raw material not found' });
    }

    res.json(materials[0]);
  } catch (error) {
    console.error('Get raw material error:', error);
    res.status(500).json({ error: 'Failed to get raw material' });
  }
};

export const createRawMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, supplier_id, unit, purchase_price, minimum_stock, current_stock, description } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO raw_materials (name, sku, supplier_id, unit, purchase_price, minimum_stock, current_stock, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, supplier_id, unit, purchase_price || 0, minimum_stock || 0, current_stock || 0, description]
    );

    res.json({
      id: result.insertId,
      name,
      sku,
      supplier_id,
      unit,
      purchase_price,
      minimum_stock,
      current_stock,
      description
    });
  } catch (error) {
    console.error('Create raw material error:', error);
    res.status(500).json({ error: 'Failed to create raw material' });
  }
};

export const updateRawMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, supplier_id, unit, purchase_price, minimum_stock, current_stock, description } = req.body;

    await pool.query(
      `UPDATE raw_materials
       SET name = ?, sku = ?, supplier_id = ?, unit = ?, purchase_price = ?, minimum_stock = ?, current_stock = ?, description = ?
       WHERE id = ?`,
      [name, sku, supplier_id, unit, purchase_price, minimum_stock, current_stock, description, id]
    );

    res.json({
      id,
      name,
      sku,
      supplier_id,
      unit,
      purchase_price,
      minimum_stock,
      current_stock,
      description
    });
  } catch (error) {
    console.error('Update raw material error:', error);
    res.status(500).json({ error: 'Failed to update raw material' });
  }
};

export const deleteRawMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM raw_materials WHERE id = ?', [id]);
    res.json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Delete raw material error:', error);
    res.status(500).json({ error: 'Failed to delete raw material' });
  }
};
