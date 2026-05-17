const prisma = require('../prismaClient');

// GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true, studentId: true, firstName: true, lastName: true,
                phone: true, lineId: true, role: true, createdAt: true,
                photo: true,
                _count: { select: { transactions: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users', detail: err.message });
    }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true, studentId: true, firstName: true, lastName: true,
                phone: true, lineId: true, role: true, createdAt: true,
                photo: true,
                _count: { select: { transactions: true } }
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user', detail: err.message });
    }
};

// PATCH /api/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['student', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: { id: true, studentId: true, role: true }
        });
        res.json(user);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Update role failed', detail: err.message });
    }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting self or other admins if strict policy needed.
        // For now preventing deleting account with same ID as requester to avoid lock out.
        if (req.user && req.user.id === parseInt(id)) {
            return res.status(400).json({ error: "Cannot delete your own account." });
        }

        // 1. Delete all transactions associated with user
        await prisma.transaction.deleteMany({
            where: { userId: parseInt(id) }
        });

        // 2. Delete the user
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Delete failed', detail: err.message });
    }
};
