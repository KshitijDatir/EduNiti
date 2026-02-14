import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error('❌ Global Error Handler:', err);
    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            message: 'Validation error',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    console.error('❌ Unhandled error:', err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(500).json({ message: 'Internal server error' });
}
