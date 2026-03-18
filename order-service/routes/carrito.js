const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const { verifyToken } = require('../middleware/auth');

// All cart routes require authentication
router.use(verifyToken);

router.get('/', carritoController.getCarrito);
router.post('/agregar', carritoController.agregarAlCarrito);
router.put('/cantidad/:id_carrito', carritoController.actualizarCantidad);
router.delete('/item/:id_carrito', carritoController.eliminarItem);
router.delete('/vaciar', carritoController.vaciarCarrito);
router.get('/disponibilidad', carritoController.verificarDisponibilidad);
router.get('/agrupado', carritoController.getCarritoAgrupado);
router.get('/resumen', carritoController.getResumenCarrito);

module.exports = router;
