const express = require('express');
const router = express.Router();
const {
  getMenusByStore,
  createMenu,
  updateMenuAvailability,
} = require('../controllers/menuController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public Route (Untuk Katalog Menu Pelanggan)
router.get('/store/:storeId', getMenusByStore);

// Protected Routes (Untuk Admin / Owner / Kasir)
router.post('/store/:storeId', verifyToken, requireRole('OWNER', 'KASIR'), createMenu);
router.patch('/:id/availability', verifyToken, requireRole('OWNER', 'KASIR'), updateMenuAvailability);

module.exports = router;
