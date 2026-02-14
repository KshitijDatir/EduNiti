import { Router } from 'express';
import { register, login, me, healthCheck } from '../controllers/auth.controller.js';

const router = Router();

// Public
router.get('/health', healthCheck);
router.post('/register', register);
router.post('/login', login);

// Protected (token in header)
router.get('/me', me);

export default router;
