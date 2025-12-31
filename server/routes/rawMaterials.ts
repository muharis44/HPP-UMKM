import express from 'express';
import {
  getRawMaterials,
  getRawMaterial,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial
} from '../controllers/rawMaterialsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getRawMaterials);
router.get('/:id', getRawMaterial);
router.post('/', createRawMaterial);
router.put('/:id', updateRawMaterial);
router.delete('/:id', deleteRawMaterial);

export default router;
