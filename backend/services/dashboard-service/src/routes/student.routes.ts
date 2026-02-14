import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getProfile, getResults, getSessions, getUpcomingTests, healthCheck } from '../controllers/student.controller.js';

const router = Router();

// Public
router.get('/health', healthCheck);

// Protected (require JWT)
router.get('/profile', authenticate, getProfile);
router.get('/results', authenticate, getResults);
router.get('/sessions', authenticate, getSessions);
router.get('/upcoming-tests', authenticate, getUpcomingTests);

export default router;
