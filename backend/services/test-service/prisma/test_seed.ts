
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Multimedia Test...');

    const mediaTest = await prisma.test.create({
        data: {
            title: 'Multimedia Capabilities',
            scheduledAt: new Date(),
            isActive: true,
            questions: {
                create: [
                    {
                        questionText: 'Analyze the following video content:',
                        mediaUrl: 'https://d1mh8twbagv3j5.cloudfront.net/argo_final.mp4',
                        mediaType: 'video',
                        sortOrder: 1,
                        options: {
                            create: [
                                { text: 'Option A', isCorrect: true, sortOrder: 1 },
                                { text: 'Option B', isCorrect: false, sortOrder: 2 },
                            ],
                        },
                    },
                ],
            },
        },
    });

    console.log(`✅ Seeded: ${mediaTest.title} (${mediaTest.id})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
