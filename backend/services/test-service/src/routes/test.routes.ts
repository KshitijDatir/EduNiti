import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getTest, healthCheck } from '../controllers/test.controller.js';

const router = Router();

// Health check (no auth required — used by NGINX/K8s)
router.get('/health', healthCheck);

// Test details (requires auth)
router.get('/:testId', authenticate, getTest);

export default router;
