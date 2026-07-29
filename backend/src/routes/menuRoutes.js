const express = require('express');
const router = express.Router();
const {
  getMenusByStore,
  createMenu,
  updateMenu,
  updateMenuAvailability,
  deleteMenu,
} = require('../controllers/menuController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public Route (Untuk Katalog Menu Pelanggan)
router.get('/store/:storeId', getMenusByStore);

// Protected Routes (Untuk Admin / Owner / Kasir)
router.post('/store/:storeId', verifyToken, requireRole('OWNER', 'KASIR'), createMenu);
router.put('/:id', verifyToken, requireRole('OWNER', 'KASIR'), updateMenu);
router.patch('/:id/availability', verifyToken, requireRole('OWNER', 'KASIR'), updateMenuAvailability);
router.delete('/:id', verifyToken, requireRole('OWNER', 'KASIR'), deleteMenu);

module.exports = router;
