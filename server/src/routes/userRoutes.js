const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// All routes here require Admin access
router.get('/', authenticateToken, authorizeAdmin, userController.getAllUsers);
router.get('/:id', authenticateToken, authorizeAdmin, userController.getUserById);
router.patch('/:id/role', authenticateToken, authorizeAdmin, userController.updateUserRole);
router.delete('/:id', authenticateToken, authorizeAdmin, userController.deleteUser);

module.exports = router;
