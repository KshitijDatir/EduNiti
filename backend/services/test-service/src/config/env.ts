import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(3003),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    DATABASE_URL: z.string().url(),

    REDIS_MODE: z.enum(['standalone', 'cluster']).default('standalone'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    REDIS_CLUSTER_NODES: z.string().default(''),

    JWT_SECRET: z.string().min(8),

    CACHE_TEST_TTL: z.coerce.number().default(600),
    CACHE_TEST_META_TTL: z.coerce.number().default(1800),

    CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
