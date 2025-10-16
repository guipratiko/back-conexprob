import express from 'express';
import { 
  getModels, 
  getModelById, 
  createModel, 
  updateModelStatus 
} from '../controllers/modelController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getModels);
router.get('/:id', getModelById);
router.post('/', authenticate, authorizeRoles('model', 'admin'), createModel);
router.patch('/:id/status', authenticate, authorizeRoles('model', 'admin'), updateModelStatus);

export default router;

