import { Request, Response, NextFunction } from 'express';
import { testIdSchema } from '../validation/test.validation.js';
import { getTestById, getLiveTest } from '../services/test.service.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * GET /api/test/live
 *
 * Returns the currently live test summary.
 */
export async function getLive(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const liveTest = await getLiveTest();

        if (!liveTest) {
            res.status(404).json({ message: 'No live test available right now' });
            return;
        }

        res.json({ data: liveTest });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/test/:testId
 *
 * Returns test details with questions and options.
 * Uses Redis cache with DB fallback.
 */
export async function getTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Validate params
        const parseResult = testIdSchema.safeParse(req.params);
        if (!parseResult.success) {
            const err = createError(400, 'Invalid test ID format');
            res.status(400).json({ message: err.message });
            return;
        }

        const { testId } = parseResult.data;
        const test = await getTestById(testId);

        if (!test) {
            res.status(404).json({ message: 'Test not found' });
            return;
        }

        // Wrapped response format (recommended by BACKEND_INTEGRATION.md)
        res.json({ data: test });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/test/:testId/submit
 *
 * Stub endpoint — submission processing is not yet implemented.
 */
export async function submitTest(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
        message: 'Submission endpoint coming soon',
        status: 'not_implemented',
    });
}

/**
 * GET /api/test/health
 *
 * Health check endpoint for load balancer / K8s probes.
 */
export function healthCheck(_req: Request, res: Response): void {
    res.json({
        status: 'ok',
        service: 'test-service',
        timestamp: new Date().toISOString(),
    });
}

