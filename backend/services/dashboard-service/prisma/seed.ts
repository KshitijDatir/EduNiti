import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding dashboard database...');

    // ── Clean existing data ──────────────────────────────────────
    await prisma.examResult.deleteMany();
    await prisma.testSession.deleteMany();
    await prisma.scheduledTest.deleteMany();
    await prisma.student.deleteMany();

    // ── Create demo students ─────────────────────────────────────
    const demo = await prisma.student.create({
        data: {
            id: 'user-001',
            email: 'demo@xenia.ai',
            name: 'Demo Student',
        },
    });

    const test = await prisma.student.create({
        data: {
            id: 'user-002',
            email: 'test@xenia.ai',
            name: 'Test Student',
        },
    });

    console.log(`  ✅ Created ${2} students`);

    // ── Seed exam results ────────────────────────────────────────
    const results = await prisma.examResult.createMany({
        data: [
            {
                studentId: demo.id,
                testTitle: 'JavaScript Fundamentals',
                score: 4,
                totalQuestions: 5,
                percentage: 80.0,
                completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
                studentId: demo.id,
                testTitle: 'React Basics',
                score: 3,
                totalQuestions: 4,
                percentage: 75.0,
                completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
            {
                studentId: demo.id,
                testTitle: 'CSS Grid & Flexbox',
                score: 5,
                totalQuestions: 5,
                percentage: 100.0,
                completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            },
            {
                studentId: test.id,
                testTitle: 'TypeScript Advanced',
                score: 2,
                totalQuestions: 5,
                percentage: 40.0,
                completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
        ],
    });

    console.log(`  ✅ Created ${results.count} exam results`);

    // ── Seed active sessions ─────────────────────────────────────
    const sessions = await prisma.testSession.createMany({
        data: [
            {
                studentId: demo.id,
                testTitle: 'Data Structures & Algorithms',
                status: 'active',
                startedAt: new Date(),
            },
            {
                studentId: demo.id,
                testTitle: 'Node.js Fundamentals',
                status: 'completed',
                startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
        ],
    });

    console.log(`  ✅ Created ${sessions.count} test sessions`);

    // ── Seed upcoming tests ──────────────────────────────────────
    const upcoming = await prisma.scheduledTest.createMany({
        data: [
            {
                title: 'System Design Interview Prep',
                description: 'Cover load balancers, caching, databases, and microservices.',
                scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'SQL & Database Concepts',
                description: 'JOINs, indexing, normalization, and query optimization.',
                scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Docker & Kubernetes Basics',
                description: 'Containers, orchestration, deployments, and services.',
                scheduledAt: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
            },
        ],
    });

    console.log(`  ✅ Created ${upcoming.count} upcoming tests`);

    console.log('✅ Dashboard seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
