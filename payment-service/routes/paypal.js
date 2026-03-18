const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');
const { verifyToken } = require('../middleware/auth');

// Public (to create order, or maybe protected?) Original says no auth for create-order.
router.post('/create-order', paypalController.createOrder);

// Protected
router.post('/capture-order', verifyToken, paypalController.captureOrder);
router.get('/orders/:orderID', verifyToken, paypalController.getOrderDetails);

module.exports = router;
