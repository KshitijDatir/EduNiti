import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
}));

// ── Parsing ──────────────────────────────────────────────────────
app.use(express.json());

// ── Logging ──────────────────────────────────────────────────────
app.use(morgan('short'));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

app.get('/', (_req, res) => {
    res.json({ service: 'xenia-auth-service', status: 'running' });
});

// ── Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

export default app;
