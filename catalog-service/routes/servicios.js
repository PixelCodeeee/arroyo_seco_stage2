const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const { verifyToken, verifyoferente, optionalAuth } = require('../middleware/auth');

// Public (with optional auth for oferente filtering)
router.get('/', optionalAuth, servicioController.obtenerServicios);
router.get('/oferente/:oferenteId', servicioController.obtenerServiciosPorOferente);
router.get('/:id', servicioController.obtenerServicioPorId);

// Protected
router.post('/', verifyToken, verifyoferente, servicioController.crearServicio);
router.put('/:id', verifyToken, verifyoferente, servicioController.actualizarServicio);
router.delete('/:id', verifyToken, verifyoferente, servicioController.eliminarServicio);

module.exports = router;
