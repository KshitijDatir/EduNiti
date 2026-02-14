import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error('❌ Unhandled error:', err.message);

    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(500).json({
        message: 'Internal server error',
    });
}
