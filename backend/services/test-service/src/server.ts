import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';

async function start(): Promise<void> {
    try {
        // Verify database connection
        await prisma.$connect();
        console.log('✅ PostgreSQL connected');

        // Verify Redis connection (ping)
        await redis.ping();
        console.log('✅ Redis ready');

        // Start HTTP server
        app.listen(env.PORT, () => {
            console.log(`\n🚀 Test Service running on port ${env.PORT}`);
            console.log(`   Mode: ${env.NODE_ENV}`);
            console.log(`   Redis: ${env.REDIS_MODE}`);
            console.log(`   Health: http://localhost:${env.PORT}/api/test/health\n`);
        });
    } catch (err) {
        console.error('❌ Failed to start Test Service:', err);
        process.exit(1);
    }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
