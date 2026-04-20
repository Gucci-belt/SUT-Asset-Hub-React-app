const prisma = require('../prismaClient');

// DELETE /api/transactions/:id
exports.cancelRequest = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const transaction = await prisma.transaction.findUnique({ where: { id: Number(id) } });

        if (!transaction) return res.status(404).json({ error: "Transaction not found" });

        // Ensure user owns the transaction and it is pending
        if (transaction.userId !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        if (transaction.status !== 'pending') {
            return res.status(400).json({ error: "Cannot cancel a processed transaction" });
        }

        await prisma.transaction.delete({ where: { id: Number(id) } });
        res.json({ message: "Request cancelled successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/borrow
exports.createTransaction = async (req, res) => {
    const { userId, assetId, dueDate, reason } = req.body;
    // Check if user ID matches authenticated user
    if (req.user.id !== Number(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized transaction request" });
    }

    try {
        // Check if asset is available
        const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
        if (!asset || asset.status !== 'available') {
            return res.status(400).json({ error: 'Asset not available' });
        }

        // Create transaction (pending) - Asset status remains 'available' until approved by admin for 'pending' flow, 
        // OR strictly reserved. The current flow in index.js was: status='pending', asset NOT changed (handled in approve).
        // Let's stick to the current logic: Create Pending, Asset Status remains Available until Approve.

        const transaction = await prisma.transaction.create({
            data: {
                userId: Number(userId),
                assetId: Number(assetId),
                dueDate: new Date(dueDate),
                reason: reason,
                status: 'pending'
            }
        });
        res.json(transaction);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/admin/transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: { user: true, asset: true },
            orderBy: { borrowDate: 'desc' }
        });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/admin/transactions/:id/approve
exports.approveTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({ where: { id: Number(id) } });
            if (!transaction) throw new Error("Transaction not found");

            const asset = await tx.asset.findUnique({ where: { id: transaction.assetId } });
            if (!asset) throw new Error("Asset not found");

            if (asset.status !== 'available') {
                throw new Error("Asset is not available (already borrowed or in maintenance)");
            }

            const updatedTx = await tx.transaction.update({
                where: { id: Number(id) },
                data: { status: 'approved' }
            });

            await tx.asset.update({
                where: { id: transaction.assetId },
                data: { status: 'borrowed' }
            });

            return updatedTx;
        });
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// PUT /api/admin/transactions/:id/reject
exports.rejectTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const transaction = await prisma.transaction.update({
            where: { id: Number(id) },
            data: { status: 'rejected' }
        });
        res.json(transaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/admin/transactions/:id/return
exports.returnTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({ where: { id: Number(id) } });
            if (!transaction) throw new Error("Transaction not found");

            const updatedTx = await tx.transaction.update({
                where: { id: Number(id) },
                data: {
                    status: 'returned',
                    returnDate: new Date()
                }
            });

            await tx.asset.update({
                where: { id: transaction.assetId },
                data: { status: 'available' }
            });

            return updatedTx;
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/transactions/my-history
exports.getMyHistory = async (req, res) => {
    // FIX IDOR: Use ID from Token (req.user.id) instead of Query Param
    const userId = req.user.id;

    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: Number(userId) },
            include: { asset: true },
            orderBy: [
                { status: 'asc' },
                { borrowDate: 'desc' }
            ]
        });

        // Custom sort to prioritize Pending and Approved
        const statusOrder = { 'pending': 1, 'approved': 2, 'borrowed': 2, 'returned': 3, 'rejected': 4 };
        transactions.sort((a, b) => {
            const orderA = statusOrder[a.status] || 99;
            const orderB = statusOrder[b.status] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return new Date(b.borrowDate) - new Date(a.borrowDate);
        });

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
