import express from 'express';
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  getModelMessagePrice
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Rota pública para buscar preço
router.get('/model-price/:modelId', getModelMessagePrice);

// Todas as outras rotas requerem autenticação
router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/conversation/:modelId', getConversation);
router.post('/send', sendMessage);
router.patch('/read/:modelId', markAsRead);

export default router;

