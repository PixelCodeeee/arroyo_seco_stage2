const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { verifyToken, verifyoferente } = require('../middleware/auth');

// Public
router.get('/', productoController.obtenerProductos);
router.get('/oferente/:oferenteId', productoController.obtenerProductosPorOferente);
router.get('/mis-productos', verifyToken, verifyoferente, productoController.obtenerMisProductos); // ← moved up
router.get('/:id', productoController.obtenerProducto);

// Protected
router.post('/', verifyToken, verifyoferente, productoController.crearProducto);
router.put('/:id', verifyToken, verifyoferente, productoController.actualizarProducto);
router.delete('/:id', verifyToken, verifyoferente, productoController.eliminarProducto);

module.exports = router;
