import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

async function start() {
    // ── Connect to PostgreSQL ────────────────────────────────────
    try {
        await prisma.$connect();
        console.log('✅ PostgreSQL connected');
    } catch (err) {
        console.error('❌ PostgreSQL connection failed:', err);
        process.exit(1);
    }

    // ── Start HTTP server ────────────────────────────────────────
    const server = app.listen(env.PORT, () => {
        console.log(`🔐 Auth Service running on port ${env.PORT}`);
        console.log(`   Environment: ${env.NODE_ENV}`);
    });

    // ── Graceful shutdown ────────────────────────────────────────
    const shutdown = async (signal: string) => {
        console.log(`\n🛑 ${signal} received — shutting down...`);
        server.close(async () => {
            await prisma.$disconnect();
            console.log('✅ Auth Service stopped');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
