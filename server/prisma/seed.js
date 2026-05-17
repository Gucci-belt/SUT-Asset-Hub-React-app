const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');
    const hashedPW = await bcrypt.hash('123456', 10);

    // สร้างหรืออัปเดต Admin
    await prisma.user.upsert({
        where: { studentId: 'admin' },
        update: { passwordHash: hashedPW, role: 'admin' },
        create: {
            studentId: 'admin',
            passwordHash: hashedPW,
            role: 'admin',
            pin: '1234'
        },
    });

    // สร้างหรืออัปเดต Student (B67)
    await prisma.user.upsert({
        where: { studentId: 'b67' },
        update: { passwordHash: hashedPW, role: 'student' },
        create: {
            studentId: 'b67',
            passwordHash: hashedPW,
            role: 'student',
            pin: '1234'
        },
    });

    console.log('🎉 Seeding finished successfully!');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });