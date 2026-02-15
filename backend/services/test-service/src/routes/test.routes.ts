import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getTest, getLive, submitTest, healthCheck } from '../controllers/test.controller.js';

const router = Router();

// Health check (no auth required — used by NGINX/K8s)
router.get('/health', healthCheck);

// Live test (must be BEFORE /:testId to avoid route collision)
router.get('/live', authenticate, getLive);

// Test details (requires auth)
router.get('/:testId', authenticate, getTest);

// Submit answers (stub — not yet implemented)
router.post('/:testId/submit', authenticate, submitTest);

export default router;

