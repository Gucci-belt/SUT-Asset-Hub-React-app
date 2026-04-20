const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Create/Update Mock Admin
    const adminPassword = await bcrypt.hash('1234', 10);
    const admin = await prisma.user.upsert({
        where: { studentId: 'admin' },
        update: {
            passwordHash: adminPassword,
            role: 'admin'
        },
        create: {
            studentId: 'admin',
            passwordHash: adminPassword,
            role: 'admin',
            pin: '1234'
        },
    });
    console.log(`✅ Admin user ready: ${admin.studentId} (Pass: 1234)`);

    // 2. Create/Update Mock Student
    const studentPassword = await bcrypt.hash('1234', 10);
    const student = await prisma.user.upsert({
        where: { studentId: 'b67' },
        update: {
            passwordHash: studentPassword,
            role: 'student'
        },
        create: {
            studentId: 'b67',
            passwordHash: studentPassword,
            role: 'student',
            pin: '1234'
        },
    });
    console.log(`✅ Student user ready: ${student.studentId} (Pass: 1234)`);

    console.log('🎉 Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
