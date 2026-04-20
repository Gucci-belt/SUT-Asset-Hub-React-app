const prisma = require('../prismaClient');

// GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { id: 'asc' },
            select: { id: true, studentId: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting self or other admins if strict policy needed.
        // For now preventing deleting account with same ID as requester to avoid lock out.
        if (req.user.id === Number(id)) {
            return res.status(400).json({ error: "Cannot delete your own account." });
        }

        // 1. Delete all transactions associated with user
        await prisma.transaction.deleteMany({
            where: { userId: Number(id) }
        });

        // 2. Delete the user
        await prisma.user.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
