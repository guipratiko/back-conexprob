import express from 'express';
import { 
  getCreditPackages, 
  purchaseCredits, 
  getTransactions, 
  getBalance 
} from '../controllers/creditController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/packages', getCreditPackages);
router.get('/balance', authenticate, getBalance);
router.get('/transactions', authenticate, getTransactions);
router.post('/purchase', authenticate, purchaseCredits);

export default router;

