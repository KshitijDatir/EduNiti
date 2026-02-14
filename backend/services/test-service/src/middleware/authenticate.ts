import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthPayload {
    userId: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

/**
 * JWT verification middleware.
 * Verifies the Bearer token using the shared secret.
 * Does NOT issue tokens — that's the auth service's job.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

        req.user = {
            userId: decoded.sub as string ?? decoded.id as string ?? decoded.userId as string,
            email: decoded.email as string ?? '',
        };

        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired' });
            return;
        }
        if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        res.status(401).json({ message: 'Authentication failed' });
    }
}
