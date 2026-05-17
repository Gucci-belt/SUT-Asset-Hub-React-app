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

// --- 0. Authentication APIs ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

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

