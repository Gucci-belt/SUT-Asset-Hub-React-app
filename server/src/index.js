const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./prismaClient'); // Use shared instance
const path = require('path');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Prometheus Metrics ---
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
});


// --- Routes ---
const transactionRoutes = require('./routes/transactionRoutes');

// --- 1. Image Upload System ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'asset-' + uniqueSuffix + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ imagePath: `/uploads/${req.file.filename}` });
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// --- 0. Authentication APIs ---
app.post('/api/auth/register', async (req, res) => {
    const { studentId, password, role, pin } = req.body; // Accept PIN
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                studentId,
                passwordHash: hashedPassword,
                passwordHash: hashedPassword,
                role: 'student', // FORCE STUDENT ROLE: Prevent creating new admins via API
                pin: pin || '1234' // Default PIN if not provided (for simplicity)
            }
        });
        res.json({ message: 'User registered successfully', userId: user.id });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Student ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { studentId, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { studentId } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role, studentId: user.studentId }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, role: user.role, studentId: user.studentId, userId: user.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// TQF3 Requirement: Reset Password (Secured with PIN)
app.post('/api/auth/reset-password', async (req, res) => {
    const { studentId, newPassword, pin } = req.body;
    try {
        // 1. Find user
        const user = await prisma.user.findUnique({ where: { studentId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // 2. Check PIN
        // If user has no PIN (old users), we might fallback or deny. Let's deny to be safe, or allow '1234'.
        const userPin = user.pin || '1234';
        if (userPin !== pin) {
            return res.status(401).json({ error: 'Invalid Security PIN' });
        }

        // 3. Reset Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { studentId },
            data: { passwordHash: hashedPassword }
        });
        res.json({ message: 'Password reset successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 2. Asset Management ---
const assetRoutes = require('./routes/assetRoutes');
app.use('/api/assets', assetRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// --- 3. Transaction/Borrowing & Admin Workflow ---
// Matches /api/transactions/borrow, /api/transactions/my-history
app.use('/api/transactions', transactionRoutes);

// Matches /api/admin/transactions (GET all, approve, etc - protected in routes)
app.use('/api/admin/transactions', transactionRoutes);


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (Bound to 0.0.0.0 for external access)`);
});

