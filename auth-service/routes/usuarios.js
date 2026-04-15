const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, verifyAdmin, verifyRole } = require('../middleware/auth');

// 🌐 Public routes
router.post('/register', usuarioController.crearUsuario);
router.post('/login', usuarioController.loginUsuario);
router.post('/verify-2fa', usuarioController.verify2FA);
router.post('/resend-2fa', usuarioController.resend2FACode);
router.post('/forgot-password', usuarioController.forgotPassword);
router.post('/reset-password', usuarioController.resetPassword);

// 🔒 Protected routes

// Logout
router.post('/logout', verifyToken, usuarioController.logoutUsuario);

// Cambiar contraseña (usuario mismo o admin lo controla el controller)
router.put('/:id/password', verifyToken, usuarioController.updatePassword);

// 🔥 VER USUARIOS → admin + moderador
router.get(
  '/',
  verifyToken,
  verifyRole(['admin', 'moderador']),
  usuarioController.obtenerUsuarios
);

// Ver usuario por ID (cualquier autenticado)
router.get('/:id', verifyToken, usuarioController.obtenerUsuarioPorId);

// 🔥 EDITAR USUARIO → admin + moderador
router.put(
  '/:id',
  verifyToken,
  verifyRole(['admin', 'moderador']),
  usuarioController.actualizarUsuario
);

// Cambio de correo
router.post('/:id/cambio-correo/solicitar', verifyToken, usuarioController.solicitarCambioCorreo);
router.post('/:id/cambio-correo/verificar', verifyToken, usuarioController.verificarCambioCorreo);

// ❌ ELIMINAR → SOLO ADMIN
router.delete(
  '/:id',
  verifyToken,
  verifyRole(['admin']),
  usuarioController.eliminarUsuario
);

// 📊 Analíticas → admin + moderador
router.get(
  '/analiticas/stats',
  verifyToken,
  verifyRole(['admin', 'moderador']),
  usuarioController.getStats
);

module.exports = router;