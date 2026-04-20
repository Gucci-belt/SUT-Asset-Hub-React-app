const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// All routes here require Admin access
router.get('/', authenticateToken, authorizeAdmin, userController.getAllUsers);
router.delete('/:id', authenticateToken, authorizeAdmin, userController.deleteUser);

module.exports = router;
