const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticateToken, authController.getMe);

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, lineId, photo } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName  !== undefined && { lastName }),
        ...(phone     !== undefined && { phone }),
        ...(lineId    !== undefined && { lineId }),
        ...(photo     !== undefined && { photo }),
      },
    });
    const { password, pin, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
});

router.post('/forgot-password/check', async (req, res) => {
  try {
    const { studentId } = req.body;
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return res.status(404).json({ error: 'Student ID not found' });
    res.json({ message: 'Student ID found. Please enter your PIN.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/forgot-password/verify-pin', async (req, res) => {
  try {
    const { studentId, pin } = req.body;
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return res.status(404).json({ error: 'Student ID not found' });
    if (user.pin !== pin) return res.status(400).json({ error: 'Invalid PIN' });
    res.json({ message: 'PIN verified. You may now reset your password.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { studentId, pin, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return res.status(404).json({ error: 'Student ID not found' });
    if (user.pin !== pin) return res.status(400).json({ error: 'Invalid PIN' });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { studentId },
      data: { passwordHash: hashed }
    });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

module.exports = router;
