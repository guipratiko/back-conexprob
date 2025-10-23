import express from 'express';
import { register, login, getMe, verifyRegistrationToken, completeRegistration } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/verify-token/:token', verifyRegistrationToken);
router.post('/complete-registration', completeRegistration);

export default router;

