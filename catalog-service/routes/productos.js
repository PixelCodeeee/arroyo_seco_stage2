const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { verifyToken, verifyoferente, verifyAdminOrModerador, optionalAuth } = require('../middleware/auth');

// Public (with optional auth for oferente filtering)
router.get('/', optionalAuth, productoController.obtenerProductos);
router.get('/oferente/:oferenteId', productoController.obtenerProductosPorOferente);
router.get('/mis-productos', verifyToken, verifyoferente, productoController.obtenerMisProductos);
router.get('/:id', productoController.obtenerProducto);

// Admin, Moderador u Oferente (el controller maneja IDOR internamente)
router.post('/', verifyToken, productoController.crearProducto);
router.put('/:id', verifyToken, productoController.actualizarProducto);

// Solo Admin u Oferente dueño (el controller maneja IDOR internamente)
router.delete('/:id', verifyToken, productoController.eliminarProducto);

module.exports = router;