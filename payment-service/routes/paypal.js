// const express = require('express');
// const router = express.Router();
// const paypalController = require('../controllers/paypalController');
// const { verifyToken } = require('../middleware/auth');

// // Public (to create order, or maybe protected?) Original says no auth for create-order.
// router.post('/create-order', paypalController.createOrder);

// // Protected
// router.post('/capture-order', verifyToken, paypalController.captureOrder);
// router.get('/orders/:orderID', verifyToken, paypalController.getOrderDetails);

// module.exports = router;

// routes/paypal.js
// ⚠️ Nombre mantenido para compatibilidad — ahora usa MercadoPago

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paypalController');
const { verifyToken } = require('../middleware/auth');

// ── Config pública ────────────────────────────────────────────────────
// GET /api/paypal/config
router.get('/config', ctrl.getPublicConfig);

// ── CARRITO / COMPRADOR ───────────────────────────────────────────────
// POST /api/paypal/create-order  (sin auth, igual que antes con PayPal)
router.post('/create-order', ctrl.createOrder);

// POST /api/paypal/capture-order  (con auth)
router.post('/capture-order', verifyToken, ctrl.captureOrder);

// GET /api/paypal/orders/:orderID  (con auth)
router.get('/orders/:orderID', verifyToken, ctrl.getOrderDetails);

// POST /api/paypal/webhook  (MP llama aquí, sin auth)
router.post('/webhook', ctrl.webhook);

// ── OFERENTE OAuth ────────────────────────────────────────────────────
// GET /api/paypal/mp/oauth-url  (con auth — el oferente ya está logueado)
router.get('/mp/oauth-url', verifyToken, ctrl.getOAuthUrl);

// GET /api/paypal/mp/callback  (MP redirige aquí, sin auth)
router.get('/mp/callback', ctrl.mpCallback);

// GET /api/paypal/mp/estado  (con auth — consulta su propio estado)
router.get('/mp/estado', verifyToken, ctrl.getMpEstado);

module.exports = router;