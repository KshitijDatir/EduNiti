import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding auth database...');

    await prisma.user.deleteMany();

    const SALT_ROUNDS = 10;

    const users = [
        {
            id: 'user-001',
            email: 'demo@xenia.ai',
            name: 'Demo Student',
            password: 'demo123',
        },
        {
            id: 'user-002',
            email: 'test@xenia.ai',
            name: 'Test Student',
            password: 'test123',
        },
    ];

    for (const u of users) {
        const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
        await prisma.user.create({
            data: {
                id: u.id,
                email: u.email,
                name: u.name,
                passwordHash,
                provider: 'local',
            },
        });
        console.log(`  ✅ Created user: ${u.email} (password: ${u.password})`);
    }

    console.log('✅ Auth seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
