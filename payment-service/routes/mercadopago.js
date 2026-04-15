const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mercadopagoController');
const { verifyToken } = require('../middleware/auth');

// ── Config pública ────────────────────────────────────────────────────
// GET /api/mercadopago/config
router.get('/config', ctrl.getPublicConfig);

// ── CARRITO / COMPRADOR ───────────────────────────────────────────────
// POST /api/mercadopago/create-order
router.post('/create-order', ctrl.createOrder);

// POST /api/mercadopago/capture-order
router.post('/capture-order', verifyToken, ctrl.captureOrder);

// GET /api/mercadopago/orders/:orderID
router.get('/orders/:orderID', verifyToken, ctrl.getOrderDetails);

// POST /api/mercadopago/webhook
router.post('/webhook', ctrl.webhook);

// ── OFERENTE OAuth ────────────────────────────────────────────────────
// GET /api/mercadopago/mp/oauth-url
router.get('/mp/oauth-url', verifyToken, ctrl.getOAuthUrl);

// GET /api/mercadopago/mp/callback
router.get('/mp/callback', ctrl.mpCallback);

// GET /api/mercadopago/mp/estado
router.get('/mp/estado', verifyToken, ctrl.getMpEstado);

router.get('/debug', ctrl.debugEnv);

module.exports = router;