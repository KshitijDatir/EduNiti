import { Request, Response, NextFunction } from 'express';
import * as studentService from '../services/student.service.js';

// ── GET /api/student/profile ─────────────────────────────────────
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId, email, name } = req.user!;

        const profile = await studentService.getOrCreateProfile(userId, email, name);

        res.json({ data: profile });
    } catch (err) {
        next(err);
    }
}

// ── GET /api/student/results ─────────────────────────────────────
export async function getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const results = await studentService.getResults(req.user!.userId);

        res.json({ data: results });
    } catch (err) {
        next(err);
    }
}

// ── GET /api/student/sessions ────────────────────────────────────
export async function getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const sessions = await studentService.getSessions(req.user!.userId);

        res.json({ data: sessions });
    } catch (err) {
        next(err);
    }
}

// ── GET /api/student/upcoming-tests ──────────────────────────────
export async function getUpcomingTests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const tests = await studentService.getUpcomingTests();

        res.json({ data: tests });
    } catch (err) {
        next(err);
    }
}

// ── GET /api/student/health ──────────────────────────────────────
export function healthCheck(_req: Request, res: Response): void {
    res.json({
        status: 'ok',
        service: 'dashboard-service',
        timestamp: new Date().toISOString(),
    });
}
