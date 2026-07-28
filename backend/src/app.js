require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { initSocket } = require('./config/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Inisialisasi Server WebSocket Socket.io
initSocket(server);

// Security: Helmet — sembunyikan X-Powered-By, set Content-Security-Policy, dll.
app.use(helmet({ contentSecurityPolicy: false }));

// Middleware CORS — batasi ke frontend yang dikenal
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Middleware Parser JSON
app.use(express.json({ limit: '1mb' }));

// Middleware Rate Limiter (Max 200 request per 15 menit per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi beberapa saat lagi.',
  },
});
app.use(limiter);

// Root Route Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server Backend Warmindo POS berjalan dengan normal 🚀',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);

// Global Error Handler
app.use(errorHandler);

// Jalankan Server jika dieksekusi langsung
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🌐 Server Backend & Socket.io Warmindo POS berjalan di http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
