import { redis } from '../config/redis.js';
import { env } from '../config/env.js';

const TEST_KEY_PREFIX = 'test:';

interface CachedTest {
    id: string;
    title: string;
    questions: {
        id: string;
        questionText: string;
        options: { id: string; text: string }[];
    }[];
}

/**
 * Get cached test data by ID.
 * Returns null on cache miss.
 */
export async function getCachedTest(testId: string): Promise<CachedTest | null> {
    try {
        const cached = await redis.get(`${TEST_KEY_PREFIX}${testId}`);
        if (!cached) return null;

        console.log(`🎯 Cache HIT for test:${testId}`);
        return JSON.parse(cached) as CachedTest;
    } catch (err) {
        console.error('⚠️ Redis get error:', err);
        return null; // Fail open — fallback to DB
    }
}

/**
 * Store test data in cache.
 */
export async function setCachedTest(testId: string, data: CachedTest): Promise<void> {
    try {
        await redis.set(
            `${TEST_KEY_PREFIX}${testId}`,
            JSON.stringify(data),
            'EX',
            env.CACHE_TEST_TTL
        );
        console.log(`📝 Cached test:${testId} (TTL: ${env.CACHE_TEST_TTL}s)`);
    } catch (err) {
        console.error('⚠️ Redis set error:', err);
        // Non-fatal — request continues without caching
    }
}

/**
 * Invalidate a cached test (e.g. when questions are updated).
 */
export async function invalidateCachedTest(testId: string): Promise<void> {
    try {
        await redis.del(`${TEST_KEY_PREFIX}${testId}`);
        console.log(`🗑️ Invalidated cache for test:${testId}`);
    } catch (err) {
        console.error('⚠️ Redis del error:', err);
    }
}

/**
 * Invalidate all cached tests (admin operation).
 * Note: Scan-based deletion — safe for production, no KEYS command.
 */
export async function invalidateAllTests(): Promise<void> {
    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH',
                `${TEST_KEY_PREFIX}*`,
                'COUNT',
                100
            );
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== '0');

        console.log('🗑️ Invalidated all cached tests');
    } catch (err) {
        console.error('⚠️ Redis invalidateAll error:', err);
    }
}
