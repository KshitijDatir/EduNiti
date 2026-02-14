import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 && env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error';

    if (statusCode >= 500) {
        console.error('🔥 Server error:', {
            message: err.message,
            stack: err.stack,
            code: err.code,
        });
    }

    res.status(statusCode).json({
        message,
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

/**
 * Create an error with a status code for use in route handlers.
 */
export function createError(statusCode: number, message: string): AppError {
    const err = new Error(message) as AppError;
    err.statusCode = statusCode;
    return err;
}
