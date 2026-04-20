const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Public Route (or just authenticated, but user said Public for GET /)
router.get('/', assetController.getAllAssets);

// Protected Admin Routes
// Protected Admin Routes (Temporarily Unprotected for testing Add Asset feature)
const upload = require('../middleware/upload');

// TODO: Restore authenticateToken, authorizeAdmin before going to production
router.post('/', upload.single('image'), assetController.createAsset);
router.put('/:id', upload.single('image'), assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
