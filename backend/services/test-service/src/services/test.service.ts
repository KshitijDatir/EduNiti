import { prisma } from '../config/database.js';
import { getCachedTest, setCachedTest } from '../cache/testCache.js';

export interface TestResponse {
    id: string;
    title: string;
    questions: {
        id: string;
        questionText: string;
        options: { id: string; text: string }[];
    }[];
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
