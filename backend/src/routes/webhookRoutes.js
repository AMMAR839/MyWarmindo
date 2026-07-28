const express = require('express');
const router = express.Router();
const { handleMidtransWebhook } = require('../controllers/webhookController');

// Public Webhook Notification Callback from Midtrans
router.post('/midtrans', handleMidtransWebhook);

module.exports = router;
