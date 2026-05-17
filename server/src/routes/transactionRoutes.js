const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');
const prisma = require('../prismaClient');

// Define routes
router.post('/borrow', authenticateToken, async (req, res) => {
  try {
    const { assetId, dueDate, reason } = req.body
    if (!assetId || !dueDate) {
      return res.status(400).json({ error: 'assetId and dueDate are required' })
    }
    // Check asset is available
    const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } })
    if (!asset) return res.status(404).json({ error: 'Asset not found' })
    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available' })
    }
    const transaction = await prisma.transaction.create({
      data: {
        userId:  req.user.id,
        assetId: parseInt(assetId),
        dueDate: new Date(dueDate),
        reason:  reason ?? null,
        status:  'pending'
      }
    })
    res.status(201).json({ message: 'Borrow request submitted. Waiting for admin approval.', transaction })
  } catch (err) {
    res.status(500).json({ error: 'Borrow request failed', detail: err.message })
  }
})

router.post('/:id/request-return', authenticateToken, transactionController.requestReturn);

router.patch('/:id/extend', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { newDueDate } = req.body

    if (!newDueDate) {
      return res.status(400).json({ error: 'newDueDate is required' })
    }

    // verify this transaction belongs to the requesting user
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (transaction.status !== 'approved') {
      return res.status(400).json({ error: 'Can only extend approved transactions' })
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { dueDate: new Date(newDueDate) },
      include: {
        asset: { select: { name: true, serialNumber: true } }
      }
    })

    res.json({ message: 'Due date extended successfully', transaction: updated })
  } catch (err) {
    res.status(500).json({ error: 'Extend failed', detail: err.message })
  }
})

router.get('/my-history', authenticateToken, transactionController.getMyHistory);
router.get('/pending', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: 'pending' },
      orderBy: { borrowDate: 'desc' },
      include: {
        user:  { select: { id: true, studentId: true, firstName: true, lastName: true } },
        asset: { select: { id: true, name: true, serialNumber: true, category: true, imagePath: true } }
      }
    })
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending requests' })
  }
})

router.get('/all', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { borrowDate: 'desc' },
      take: 50, // latest 50
      include: {
        user: { select: { id: true, studentId: true, firstName: true, lastName: true } },
        asset: { select: { id: true, name: true, serialNumber: true, category: true, imagePath: true } }
      }
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions', detail: err.message });
  }
});

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
router.patch('/:id/approve', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data:  { status: 'approved' }
    })
    // Mark asset as borrowed
    await prisma.asset.update({
      where: { id: transaction.assetId },
      data:  { status: 'borrowed' }
    })
    res.json({ message: 'Request approved', transaction })
  } catch (err) {
    res.status(500).json({ error: 'Approve failed', detail: err.message })
  }
})

router.patch('/:id/reject', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data:  { status: 'rejected' }
    })
    res.json({ message: 'Request rejected', transaction })
  } catch (err) {
    res.status(500).json({ error: 'Reject failed', detail: err.message })
  }
})

router.post('/:id/confirm-return', authenticateToken, authorizeAdmin, transactionController.confirmReturn);

router.patch('/:id/return', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data:  { status: 'returned', returnDate: new Date() }
    })
    await prisma.asset.update({
      where: { id: transaction.assetId },
      data:  { status: 'available' }
    })
    res.json({ message: 'Marked as returned', transaction })
  } catch (err) {
    res.status(500).json({ error: 'Return failed', detail: err.message })
  }
})

module.exports = router;
