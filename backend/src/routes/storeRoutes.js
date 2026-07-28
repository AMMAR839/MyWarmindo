const express = require('express');
const router = express.Router();
const {
  createStore,
  getStoreBySlug,
  createTable,
  getTablesByStore,
} = require('../controllers/storeController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public Route (Untuk Pelanggan via QR)
router.get('/:slug', getStoreBySlug);

// Protected Routes (Untuk Admin / Owner)
router.post('/', createStore);
router.post('/:storeId/tables', verifyToken, requireRole('OWNER', 'KASIR'), createTable);
router.get('/:storeId/tables', getTablesByStore);

module.exports = router;
