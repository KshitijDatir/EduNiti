import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import testRoutes from './routes/test.routes.js';

const app = express();

// ── Security ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
}));

// ── Parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Logging ───────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/test', testRoutes);

// ── Root health ───────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ service: 'xenia-test-service', status: 'running' });
});

// ── 404 ───────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' });
});

// ── Error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

export default app;
