const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Define routes
router.post('/borrow', authenticateToken, transactionController.createTransaction);
router.get('/my-history', authenticateToken, transactionController.getMyHistory);
router.delete('/:id', authenticateToken, transactionController.cancelRequest); // Cancel/Delete Request

// Admin Routes (Applied here directly or via mounting path, let's keep it specific)
// Since this file is mounted at /api/transactions AND /api/admin/transactions, we need to be careful.
// Ideally, we should separate them or use specific path checks. 
// Given the current setup in index.js:
// app.use('/api/admin/transactions', transactionRoutes); -> Matches /api/admin/transactions/
// app.use('/api/transactions', transactionRoutes); -> Matches /api/transactions/
// So if we have `router.get('/', ...)` it matches BOTH `/api/admin/transactions/` and `/api/transactions/`.
// The user wants `/api/admin/*` to be admin protected.
// `getAllTransactions` should only be for admin.
// `approve/reject/return` should only be for admin.

// Helper to apply admin middleware only if hitting admin endpoints? No, easier to just protect the sensitive actions.
// GET / (All transactions) -> Admin Only
router.get('/', authenticateToken, authorizeAdmin, transactionController.getAllTransactions);

// PUT actions -> Admin Only
router.put('/:id/approve', authenticateToken, authorizeAdmin, transactionController.approveTransaction);
router.put('/:id/reject', authenticateToken, authorizeAdmin, transactionController.rejectTransaction);
router.put('/:id/return', authenticateToken, authorizeAdmin, transactionController.returnTransaction);

module.exports = router;
