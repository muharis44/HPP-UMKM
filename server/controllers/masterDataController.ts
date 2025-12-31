import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const [categories] = await pool.query('SELECT * FROM product_categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO product_categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    res.json({ id: result.insertId, name, description });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM product_categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

export const getUnits = async (req: AuthRequest, res: Response) => {
  try {
    const [units] = await pool.query('SELECT * FROM units_of_measurement ORDER BY name');
    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: 'Failed to get units' });
  }
};

export const createUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { name, abbreviation, category } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO units_of_measurement (name, abbreviation, category) VALUES (?, ?, ?)',
      [name, abbreviation, category]
    );
    res.json({ id: result.insertId, name, abbreviation, category });
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
};

export const deleteUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM units_of_measurement WHERE id = ?', [id]);
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
};
