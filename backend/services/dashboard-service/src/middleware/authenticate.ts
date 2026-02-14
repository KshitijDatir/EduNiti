import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthUser {
    userId: string;
    email: string;
    name: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

        req.user = {
            userId: (decoded.sub ?? decoded.id ?? decoded.userId) as string,
            email: (decoded.email as string) ?? '',
            name: (decoded.name as string) ?? 'Student',
        };

        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired' });
            return;
        }
        res.status(401).json({ message: 'Invalid token' });
    }
}
