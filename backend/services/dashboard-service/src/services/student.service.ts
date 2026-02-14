import { prisma } from '../config/database.js';

// ── Get or create student profile from JWT claims ────────────────
export async function getOrCreateProfile(userId: string, email: string, name: string) {
    let student = await prisma.student.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
        },
    });

    // Auto-create profile on first visit (JWT is the source of truth)
    if (!student) {
        student = await prisma.student.upsert({
            where: { email },
            update: { name },
            create: { id: userId, email, name },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
        console.log(`📋 Auto-created student profile for ${email}`);
    }

    return student;
}

// ── Get exam results for a student ───────────────────────────────
export async function getResults(studentId: string) {
    return prisma.examResult.findMany({
        where: { studentId },
        select: {
            id: true,
            testTitle: true,
            score: true,
            totalQuestions: true,
            percentage: true,
            completedAt: true,
        },
        orderBy: { completedAt: 'desc' },
    });
}

// ── Get test sessions for a student ──────────────────────────────
export async function getSessions(studentId: string) {
    return prisma.testSession.findMany({
        where: { studentId },
        select: {
            id: true,
            testTitle: true,
            startedAt: true,
            status: true,
        },
        orderBy: { startedAt: 'desc' },
    });
}

// ── Get upcoming scheduled tests ─────────────────────────────────
export async function getUpcomingTests() {
    return prisma.scheduledTest.findMany({
        where: {
            isActive: true,
            scheduledAt: { gte: new Date() },
        },
        select: {
            id: true,
            title: true,
            description: true,
            scheduledAt: true,
        },
        orderBy: { scheduledAt: 'asc' },
    });
}
