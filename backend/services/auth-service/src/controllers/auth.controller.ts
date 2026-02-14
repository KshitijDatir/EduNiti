import { Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema } from '../validation/auth.validation.js';
import * as authService from '../services/auth.service.js';

// ── POST /api/auth/register ──────────────────────────────────────
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, name, password } = registerSchema.parse(req.body);

        const result = await authService.registerUser(email, name, password);

        res.status(201).json({ data: result });
    } catch (err) {
        if (err instanceof authService.ConflictError) {
            res.status(409).json({ message: err.message });
            return;
        }
        next(err);
    }
}

// ── POST /api/auth/login ─────────────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const result = await authService.loginUser(email, password);

        res.json({ data: result });
    } catch (err) {
        if (err instanceof authService.UnauthorizedError) {
            res.status(401).json({ message: err.message });
            return;
        }
        next(err);
    }
}

// ── GET /api/auth/me ─────────────────────────────────────────────
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.slice(7);
        const user = await authService.verifyAndGetUser(token);

        res.json({ data: user });
    } catch (err) {
        if (err instanceof authService.UnauthorizedError) {
            res.status(401).json({ message: err.message });
            return;
        }
        next(err);
    }
}

// ── GET /api/auth/health ─────────────────────────────────────────
export function healthCheck(_req: Request, res: Response): void {
    res.json({
        status: 'ok',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
    });
}
