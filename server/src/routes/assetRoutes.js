const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// ─── GET routes (order matters: /stats must precede /:id) ──────────────────────
router.get('/stats', authenticateToken, authorizeAdmin,  assetController.getStats);
router.get('/',      assetController.getAllAssets);
router.get('/:id',   assetController.getAssetById);

// ─── Admin-only mutation routes ───────────────────────────────────────────────
router.post('/',     authenticateToken, authorizeAdmin, upload.single('image'), assetController.createAsset);
router.put('/:id',   authenticateToken, authorizeAdmin, upload.single('image'), assetController.updateAsset);
router.delete('/:id',authenticateToken, authorizeAdmin, assetController.deleteAsset);

module.exports = router;
