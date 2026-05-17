const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// POST /api/auth/register
exports.register = async (req, res) => {
    const { studentId, firstName, lastName, password, phone, lineId, photo, pin } = req.body; 
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                studentId,
                passwordHash: hashedPassword,
                role: 'student',
                pin:       pin       ?? null,
                firstName: firstName || null,
                lastName:  lastName  || null,
                phone:     phone     || null,
                lineId:    lineId    || null,
                photo:     photo     || null,
            }
        });
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Student ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    const { studentId, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { studentId } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role, studentId: user.studentId }, 
            SECRET_KEY, 
            { expiresIn: '7d' }
        );
        res.json({ token, role: user.role, studentId: user.studentId, firstName: user.firstName ?? null, userId: user.id });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    const { studentId, newPassword, pin } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { studentId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userPin = user.pin || '1234';
        if (userPin !== pin) {
            return res.status(401).json({ error: 'Invalid Security PIN' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { studentId },
            data: { passwordHash: hashedPassword }
        });
        res.json({ message: 'Password reset successfully' });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id:        true,
                studentId: true,
                firstName: true,
                lastName:  true,
                phone:     true,
                lineId:    true,
                photo:     true,
                role:      true,
                createdAt: true,
                _count: { select: { transactions: true } }
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
