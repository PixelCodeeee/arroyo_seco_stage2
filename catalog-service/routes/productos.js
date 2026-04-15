const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { verifyToken, verifyoferente, optionalAuth } = require('../middleware/auth');

// Public (with optional auth for oferente filtering)
router.get('/', optionalAuth, productoController.obtenerProductos);
router.get('/oferente/:oferenteId', productoController.obtenerProductosPorOferente);
router.get('/mis-productos', verifyToken, verifyoferente, productoController.obtenerMisProductos);
router.get('/:id', productoController.obtenerProducto);

// Protected
router.post('/', verifyToken, verifyoferente, productoController.crearProducto);
router.put('/:id', verifyToken, verifyoferente, productoController.actualizarProducto);
router.delete('/:id', verifyToken, verifyoferente, productoController.eliminarProducto);

module.exports = router;
