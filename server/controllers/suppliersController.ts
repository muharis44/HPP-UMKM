import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
};

export const getSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [suppliers]: any = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);

    if (suppliers.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(suppliers[0]);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to get supplier' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;

    const [result]: any = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person, phone, email, address]
    );

    res.json({ id: result.insertId, name, contact_person, phone, email, address });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;

    await pool.query(
      'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, contact_person, phone, email, address, id]
    );

    res.json({ id, name, contact_person, phone, email, address });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};
