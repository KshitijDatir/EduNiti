import { redis } from '../config/redis.js';
import { env } from '../config/env.js';

const TEST_KEY_PREFIX = 'test:';

// ── Application-level cache counters ─────────────────────────────
const counters = {
    hits: 0,
    misses: 0,
    sets: 0,
    errors: 0,
    startedAt: Date.now(),
    latencyHistory: [] as { type: 'hit' | 'miss'; ms: number; ts: number }[],
};

const MAX_LATENCY_HISTORY = 200;

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
    const start = performance.now();
    try {
        const cached = await redis.get(`${TEST_KEY_PREFIX}${testId}`);
        const ms = Math.round((performance.now() - start) * 100) / 100;

        if (!cached) {
            counters.misses++;
            counters.latencyHistory.push({ type: 'miss', ms, ts: Date.now() });
            if (counters.latencyHistory.length > MAX_LATENCY_HISTORY) counters.latencyHistory.shift();
            return null;
        }

        counters.hits++;
        counters.latencyHistory.push({ type: 'hit', ms, ts: Date.now() });
        if (counters.latencyHistory.length > MAX_LATENCY_HISTORY) counters.latencyHistory.shift();
        console.log(`Cache HIT for test:${testId} (${ms}ms)`);
        return JSON.parse(cached) as CachedTest;
    } catch (err) {
        counters.errors++;
        console.error('Redis get error:', err);
        return null;
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
        counters.sets++;
        console.log(`Cached test:${testId} (TTL: ${env.CACHE_TEST_TTL}s)`);
    } catch (err) {
        counters.errors++;
        console.error('Redis set error:', err);
    }
}

/**
 * Invalidate a cached test (e.g. when questions are updated).
 */
export async function invalidateCachedTest(testId: string): Promise<void> {
    try {
        await redis.del(`${TEST_KEY_PREFIX}${testId}`);
        console.log(`Invalidated cache for test:${testId}`);
    } catch (err) {
        console.error('Redis del error:', err);
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

        console.log('Invalidated all cached tests');
    } catch (err) {
        console.error('Redis invalidateAll error:', err);
    }
}

/**
 * Get comprehensive cache statistics.
 * Combines app-level counters with Redis server INFO.
 */
export async function getCacheStats() {
    // Parse Redis INFO
    const infoRaw = await (redis as any).info('stats') as string;
    const memRaw = await (redis as any).info('memory') as string;

    const parseLine = (raw: string, key: string): string => {
        const match = raw.match(new RegExp(`${key}:(.+)`));
        return match ? match[1].trim() : '0';
    };

    // Count test: keys
    let testKeyCount = 0;
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${TEST_KEY_PREFIX}*`, 'COUNT', 100);
        cursor = nextCursor;
        testKeyCount += keys.length;
    } while (cursor !== '0');

    const uptimeSeconds = Math.round((Date.now() - counters.startedAt) / 1000);
    const totalRequests = counters.hits + counters.misses;
    const hitRate = totalRequests > 0 ? Math.round((counters.hits / totalRequests) * 10000) / 100 : 0;

    return {
        // App-level counters
        app: {
            hits: counters.hits,
            misses: counters.misses,
            sets: counters.sets,
            errors: counters.errors,
            totalRequests,
            hitRate,
            uptimeSeconds,
        },
        // Redis server stats
        server: {
            keyspaceHits: parseInt(parseLine(infoRaw, 'keyspace_hits')),
            keyspaceMisses: parseInt(parseLine(infoRaw, 'keyspace_misses')),
            totalCommandsProcessed: parseInt(parseLine(infoRaw, 'total_commands_processed')),
            usedMemory: parseLine(memRaw, 'used_memory_human'),
            usedMemoryPeak: parseLine(memRaw, 'used_memory_peak_human'),
            connectedClients: parseInt(parseLine(infoRaw, 'connected_clients') || '0'),
        },
        // Cached keys
        keys: {
            testKeys: testKeyCount,
        },
        // Recent latency samples
        latency: counters.latencyHistory.slice(-50),
    };
}

/**
 * Reset app-level counters (for demo/testing).
 */
export function resetCacheCounters() {
    counters.hits = 0;
    counters.misses = 0;
    counters.sets = 0;
    counters.errors = 0;
    counters.startedAt = Date.now();
    counters.latencyHistory.length = 0;
}
