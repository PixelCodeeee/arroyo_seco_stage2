const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', usuarioController.crearUsuario);
router.post('/login', usuarioController.loginUsuario);
router.post('/verify-2fa', usuarioController.verify2FA);
router.post('/resend-2fa', usuarioController.resend2FACode);

// Protected routes
router.get('/', verifyToken, verifyAdmin, usuarioController.obtenerUsuarios);
router.get('/:id', verifyToken, usuarioController.obtenerUsuarioPorId);
router.put('/:id', verifyToken, usuarioController.actualizarUsuario);
router.delete('/:id', verifyToken, verifyAdmin, usuarioController.eliminarUsuario);

module.exports = router;
