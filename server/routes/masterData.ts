import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
  getUnits,
  createUnit,
  deleteUnit
} from '../controllers/masterDataController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/units', getUnits);
router.post('/units', createUnit);
router.delete('/units/:id', deleteUnit);

export default router;
