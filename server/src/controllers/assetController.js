const prisma = require('../prismaClient');

// GET /api/assets (supports ?category=Laptops)
exports.getAllAssets = async (req, res) => {
    try {
        const { category } = req.query;
        const where = category
          ? { category: { equals: String(category), mode: 'insensitive' } }
          : {};
        const assets = await prisma.asset.findMany({
            where,
            orderBy: { id: 'desc' },
        });
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/assets/:id
exports.getAssetById = async (req, res) => {
    const { id } = req.params;
    try {
        const asset = await prisma.asset.findUnique({ where: { id: Number(id) } });
        if (!asset) return res.status(404).json({ error: 'Asset not found' });
        res.json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/assets
exports.createAsset = async (req, res) => {
    const { name, serialNumber, category, status, description, imagePath } = req.body;
    
    // We expect imagePath to be either a base64 string from frontend or standard file path
    let finalImagePath = imagePath || null;

    if (req.file) {
        finalImagePath = `/uploads/${req.file.filename}`;
    }

    try {
        const newAsset = await prisma.asset.create({
            data: { 
                name, 
                serialNumber, 
                category, 
                status: status || 'available', 
                imagePath: finalImagePath, 
                description 
            }
        });
        res.status(201).json({ success: true, data: newAsset });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Serial Number already exists. Please use a unique serial number.' });
        }
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/assets/:id
exports.updateAsset = async (req, res) => {
    const { id } = req.params;
    const { name, serialNumber, category, status, description } = req.body;
    let imagePath = req.body.imagePath;

    if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
    }

    try {
        const updatedAsset = await prisma.asset.update({
            where: { id: Number(id) },
            data: {
                ...(name         !== undefined && { name }),
                ...(serialNumber !== undefined && { serialNumber }),
                ...(category     !== undefined && { category }),
                ...(status       !== undefined && { status }),
                ...(description  !== undefined && { description }),
                ...(imagePath    !== undefined && { imagePath }),
            },
        });
        res.json(updatedAsset);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.status(500).json({ error: 'Update failed', detail: err.message });
    }
};

// DELETE /api/assets/:id
exports.deleteAsset = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Block deletion if asset has active transactions
        const activeTransaction = await prisma.transaction.findFirst({
            where: {
                assetId: Number(id),
                status: { in: ['pending', 'approved', 'borrowed'] },
            },
        });

        if (activeTransaction) {
            return res.status(400).json({
                error: 'Cannot delete asset. It has pending requests or is currently borrowed.',
            });
        }

        // 2. Delete history transactions first (FK constraint)
        await prisma.transaction.deleteMany({ where: { assetId: Number(id) } });

        // 3. Delete asset
        await prisma.asset.delete({ where: { id: Number(id) } });

        res.json({ message: 'Asset deleted successfully' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.status(500).json({ error: 'Delete failed', detail: err.message });
    }
};

// GET /api/assets/stats
exports.getStats = async (req, res) => {
    try {
        const [total, inUse, maintenance, overdue, newLeases] = await Promise.all([
            prisma.asset.count(),
            prisma.asset.count({ where: { status: 'borrowed' } }),
            prisma.asset.count({ where: { status: 'maintenance' } }),
            prisma.transaction.count({
                where: {
                    status: 'approved',
                    dueDate: { lt: new Date() },
                },
            }),
            prisma.transaction.count({
                where: {
                    status: 'pending',
                    borrowDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            }),
        ]);
        res.json({ total, inUse, maintenance, overdue, newLeases });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats', detail: err.message });
    }
};
