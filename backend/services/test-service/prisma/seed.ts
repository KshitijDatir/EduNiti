import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding test database...');

    // Clean existing data
    await prisma.option.deleteMany();
    await prisma.question.deleteMany();
    await prisma.test.deleteMany();

    // ── Test 1: JavaScript Fundamentals ──────────────────────────────
    const jsTest = await prisma.test.create({
        data: {
            title: 'JavaScript Fundamentals',
            scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            isActive: true,
            questions: {
                create: [
                    {
                        questionText: 'Which keyword declares a block-scoped variable in JavaScript?',
                        sortOrder: 1,
                        options: {
                            create: [
                                { text: 'var', isCorrect: false, sortOrder: 1 },
                                { text: 'let', isCorrect: true, sortOrder: 2 },
                                { text: 'define', isCorrect: false, sortOrder: 3 },
                                { text: 'dim', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'What does "===" check in JavaScript?',
                        sortOrder: 2,
                        options: {
                            create: [
                                { text: 'Value only', isCorrect: false, sortOrder: 1 },
                                { text: 'Type only', isCorrect: false, sortOrder: 2 },
                                { text: 'Value and type', isCorrect: true, sortOrder: 3 },
                                { text: 'Reference', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'Which method converts a JSON string to a JavaScript object?',
                        sortOrder: 3,
                        options: {
                            create: [
                                { text: 'JSON.stringify()', isCorrect: false, sortOrder: 1 },
                                { text: 'JSON.parse()', isCorrect: true, sortOrder: 2 },
                                { text: 'JSON.toObject()', isCorrect: false, sortOrder: 3 },
                                { text: 'JSON.decode()', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'What is the output of typeof null?',
                        sortOrder: 4,
                        options: {
                            create: [
                                { text: '"null"', isCorrect: false, sortOrder: 1 },
                                { text: '"undefined"', isCorrect: false, sortOrder: 2 },
                                { text: '"object"', isCorrect: true, sortOrder: 3 },
                                { text: '"boolean"', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'Which array method returns a new array with filtered elements?',
                        sortOrder: 5,
                        options: {
                            create: [
                                { text: '.map()', isCorrect: false, sortOrder: 1 },
                                { text: '.filter()', isCorrect: true, sortOrder: 2 },
                                { text: '.reduce()', isCorrect: false, sortOrder: 3 },
                                { text: '.forEach()', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                ],
            },
        },
    });

    // ── Test 2: Data Structures ──────────────────────────────────────
    const dsTest = await prisma.test.create({
        data: {
            title: 'Data Structures & Algorithms',
            scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
            isActive: true,
            questions: {
                create: [
                    {
                        questionText: 'What is the time complexity of searching in a balanced BST?',
                        sortOrder: 1,
                        options: {
                            create: [
                                { text: 'O(1)', isCorrect: false, sortOrder: 1 },
                                { text: 'O(log n)', isCorrect: true, sortOrder: 2 },
                                { text: 'O(n)', isCorrect: false, sortOrder: 3 },
                                { text: 'O(n²)', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'Which data structure uses LIFO ordering?',
                        sortOrder: 2,
                        options: {
                            create: [
                                { text: 'Queue', isCorrect: false, sortOrder: 1 },
                                { text: 'Stack', isCorrect: true, sortOrder: 2 },
                                { text: 'Linked List', isCorrect: false, sortOrder: 3 },
                                { text: 'Hash Table', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'What is the worst-case time complexity of QuickSort?',
                        sortOrder: 3,
                        options: {
                            create: [
                                { text: 'O(n log n)', isCorrect: false, sortOrder: 1 },
                                { text: 'O(n)', isCorrect: false, sortOrder: 2 },
                                { text: 'O(n²)', isCorrect: true, sortOrder: 3 },
                                { text: 'O(log n)', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                ],
            },
        },
    });

    // ── Test 3: React Basics ─────────────────────────────────────────
    const reactTest = await prisma.test.create({
        data: {
            title: 'React Basics',
            scheduledAt: null, // Available anytime
            isActive: true,
            questions: {
                create: [
                    {
                        questionText: 'What hook is used to manage state in a functional component?',
                        sortOrder: 1,
                        options: {
                            create: [
                                { text: 'useEffect', isCorrect: false, sortOrder: 1 },
                                { text: 'useState', isCorrect: true, sortOrder: 2 },
                                { text: 'useContext', isCorrect: false, sortOrder: 3 },
                                { text: 'useRef', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'What does the virtual DOM do?',
                        sortOrder: 2,
                        options: {
                            create: [
                                { text: 'Replaces the real DOM entirely', isCorrect: false, sortOrder: 1 },
                                { text: 'Creates a lightweight copy for efficient diffing', isCorrect: true, sortOrder: 2 },
                                { text: 'Manages server-side rendering', isCorrect: false, sortOrder: 3 },
                                { text: 'Handles routing', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'How do you pass data from parent to child in React?',
                        sortOrder: 3,
                        options: {
                            create: [
                                { text: 'State', isCorrect: false, sortOrder: 1 },
                                { text: 'Props', isCorrect: true, sortOrder: 2 },
                                { text: 'Context', isCorrect: false, sortOrder: 3 },
                                { text: 'Events', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'Which method is used to render a React component to the DOM?',
                        sortOrder: 4,
                        options: {
                            create: [
                                { text: 'ReactDOM.render()', isCorrect: false, sortOrder: 1 },
                                { text: 'ReactDOM.createRoot().render()', isCorrect: true, sortOrder: 2 },
                                { text: 'React.mount()', isCorrect: false, sortOrder: 3 },
                                { text: 'React.display()', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                ],
            },
        },
    });

    // ── Test 4: Multimedia Test (CDN Integration) ─────────────────────
    const mediaTest = await prisma.test.create({
        data: {
            title: 'Video Learning Module',
            scheduledAt: new Date(), // Available now
            isActive: true,
            questions: {
                create: [
                    {
                        questionText: 'Watch this project demo and answer: What technology is being showcased?',
                        mediaUrl: 'https://d1mh8twbagv3j5.cloudfront.net/argo_final.mp4',
                        mediaType: 'video',
                        sortOrder: 1,
                        options: {
                            create: [
                                { text: 'Machine Learning Pipeline', isCorrect: false, sortOrder: 1 },
                                { text: 'CI/CD Deployment with Argo', isCorrect: true, sortOrder: 2 },
                                { text: 'Database Migration', isCorrect: false, sortOrder: 3 },
                                { text: 'Frontend Testing', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'Introduction to Neural Networks — Video Lecture',
                        mediaUrl: 'https://d1mh8twbagv3j5.cloudfront.net/101-intro.mp4',
                        mediaType: 'video',
                        sortOrder: 2,
                        options: {
                            create: [
                                { text: 'Perceptron', isCorrect: true, sortOrder: 1 },
                                { text: 'Decision Tree', isCorrect: false, sortOrder: 2 },
                                { text: 'Linear Regression', isCorrect: false, sortOrder: 3 },
                                { text: 'K-Means', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                    {
                        questionText: 'Data Structures Walkthrough — Video Tutorial',
                        mediaUrl: null, // Video not yet uploaded to CDN
                        mediaType: 'video',
                        sortOrder: 3,
                        options: {
                            create: [
                                { text: 'Stack', isCorrect: false, sortOrder: 1 },
                                { text: 'Queue', isCorrect: false, sortOrder: 2 },
                                { text: 'Binary Tree', isCorrect: true, sortOrder: 3 },
                                { text: 'Hash Map', isCorrect: false, sortOrder: 4 },
                            ],
                        },
                    },
                ],
            },
        },
    });

    console.log(`✅ Seeded 4 tests:`);
    console.log(`   - ${jsTest.title} (${jsTest.id})`);
    console.log(`   - ${dsTest.title} (${dsTest.id})`);
    console.log(`   - ${reactTest.title} (${reactTest.id})`);
    console.log(`   - ${mediaTest.title} (${mediaTest.id}) — 3 video questions`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
