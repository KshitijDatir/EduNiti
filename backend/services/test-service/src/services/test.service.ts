import { prisma } from '../config/database.js';
import { getCachedTest, setCachedTest } from '../cache/testCache.js';

export interface TestResponse {
    id: string;
    title: string;
    questions: {
        id: string;
        questionText: string;
        mediaUrl?: string | null;
        mediaType?: string | null;
        options: { id: string; text: string }[];
    }[];
}

export interface TestSummary {
    id: string;
    title: string;
    questionCount: number;
    scheduledAt: Date | null;
}

/**
 * Fetch test details by ID.
 * Cache-first: tries Redis, falls back to PostgreSQL, then caches the result.
 *
 * IMPORTANT: Options are returned WITHOUT the isCorrect field.
 * The client should never know which answer is correct.
 */
export async function getTestById(testId: string): Promise<TestResponse | null> {
    // 1. Try cache first
    const cached = await getCachedTest(testId);
    if (cached) return cached;

    // 2. Cache miss — query DB
    console.log(`📦 Cache MISS for test:${testId} — querying database`);

    const test = await prisma.test.findUnique({
        where: { id: testId, isActive: true },
        select: {
            id: true,
            title: true,
            questions: {
                select: {
                    id: true,
                    questionText: true,
                    mediaUrl: true,
                    mediaType: true,
                    options: {
                        select: {
                            id: true,
                            text: true,
                            // isCorrect is intentionally excluded
                        },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
                orderBy: { sortOrder: 'asc' },
            },
        },
    });

    if (!test) return null;

    // 3. Shape the response
    const response: TestResponse = {
        id: test.id,
        title: test.title,
        questions: test.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            mediaUrl: q.mediaUrl,
            mediaType: q.mediaType,
            options: q.options.map((o) => ({
                id: o.id,
                text: o.text,
            })),
        })),
    };

    // 4. Cache the result (async, non-blocking)
    setCachedTest(testId, response);

    return response;
}

/**
 * Get the currently live test (most recent active test whose scheduledAt <= now).
 * Returns a summary (not full questions) for the listing page.
 */
export async function getLiveTest(): Promise<TestSummary | null> {
    const test = await prisma.test.findFirst({
        where: {
            isActive: true,
            scheduledAt: { lte: new Date() },
        },
        orderBy: { scheduledAt: 'desc' },
        select: {
            id: true,
            title: true,
            scheduledAt: true,
            _count: { select: { questions: true } },
        },
    });

    if (!test) return null;

    return {
        id: test.id,
        title: test.title,
        questionCount: test._count.questions,
        scheduledAt: test.scheduledAt,
    };
}

