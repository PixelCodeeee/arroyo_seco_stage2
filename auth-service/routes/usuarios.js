const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', usuarioController.crearUsuario);
router.post('/login', usuarioController.loginUsuario);
router.post('/verify-2fa', usuarioController.verify2FA);
router.post('/resend-2fa', usuarioController.resend2FACode);
router.post('/forgot-password', usuarioController.forgotPassword);
router.post('/reset-password', usuarioController.resetPassword);

// Protected routes
router.put('/:id/password', verifyToken, usuarioController.updatePassword);
router.get('/', verifyToken, verifyAdmin, usuarioController.obtenerUsuarios);
router.get('/:id', verifyToken, usuarioController.obtenerUsuarioPorId);
router.put('/:id', verifyToken, usuarioController.actualizarUsuario);
router.post('/:id/cambio-correo/solicitar', verifyToken, usuarioController.solicitarCambioCorreo);
router.post('/:id/cambio-correo/verificar', verifyToken, usuarioController.verificarCambioCorreo);
router.delete('/:id', verifyToken, verifyAdmin, usuarioController.eliminarUsuario);

// Analíticas - stats de usuarios (solo admin)
router.get('/analiticas/stats', verifyToken, usuarioController.getStats);
module.exports = router;
