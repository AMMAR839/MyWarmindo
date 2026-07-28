const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrdersByStore,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getStoreAnalytics,
} = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// ─── Public Routes (Pelanggan & Webhook) ───────────────────────
router.post('/', createOrder);                          // Pelanggan membuat pesanan
router.get('/:id', getOrderById);                       // Pelanggan cek status pesanan
router.patch('/:id/payment', updatePaymentStatus);      // Simulasi QRIS / Webhook Midtrans

// ─── Protected Routes (Kasir / Owner) ──────────────────────────
router.get('/store/:storeId', verifyToken, requireRole('OWNER', 'KASIR'), getOrdersByStore);
router.get('/analytics/:storeId', verifyToken, requireRole('OWNER', 'KASIR'), getStoreAnalytics);
router.patch('/:id/status', verifyToken, requireRole('OWNER', 'KASIR'), updateOrderStatus);

module.exports = router;

