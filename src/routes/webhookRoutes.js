import express from 'express';
import { handlePaymentWebhook, handleN8NWebhook, handleWhatsAppMessage } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/payment', handlePaymentWebhook);
router.post('/n8n', handleN8NWebhook);
router.post('/whatsapp', handleWhatsAppMessage);

export default router;

