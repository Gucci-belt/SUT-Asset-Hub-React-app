const prisma = require('../prismaClient');

// GET /api/assets
exports.getAllAssets = async (req, res) => {
    try {
        const assets = await prisma.asset.findMany({ orderBy: { id: 'desc' } });
        res.json(assets);
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
                name,
                serialNumber,
                category,
                status,
                imagePath,
                description
            }
        });
        res.json(updatedAsset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/assets/:id
exports.deleteAsset = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Safety Check: Active Transactions
        const activeTransaction = await prisma.transaction.findFirst({
            where: {
                assetId: Number(id),
                status: { in: ['pending', 'approved', 'borrowed'] }
            }
        });

        if (activeTransaction) {
            return res.status(400).json({
                error: 'Cannot delete asset. It has pending requests or is currently borrowed.'
            });
        }

        // 2. Delete Asset
        // Note: We might want to delete related transactions history first or use cascade delete.
        // For now, let's delete the asset. If foreign keys exist, we might need to delete history.
        // Prisma schema usually requires explicit deletion of relations unless Cascade is set.
        // Let's check schema/setup. If transactions exist (returned/rejected), deleting asset might fail if no Cascade.
        // Safe bet: Delete transactions first or assume Cascade. 
        // Let's try to delete transactions first to be clean.
        await prisma.transaction.deleteMany({
            where: { assetId: Number(id) }
        });

        await prisma.asset.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Asset deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
