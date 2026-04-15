const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const { verifyToken, verifyoferente, optionalAuth } = require('../middleware/auth');

// Public (with optional auth for oferente filtering)
router.get('/', optionalAuth, servicioController.obtenerServicios);
router.get('/oferente/:oferenteId', servicioController.obtenerServiciosPorOferente);
router.get('/:id', servicioController.obtenerServicioPorId);

// Admin, Moderador u Oferente (el controller maneja IDOR internamente)
router.post('/', verifyToken, servicioController.crearServicio);
router.put('/:id', verifyToken, servicioController.actualizarServicio);

// Solo Admin u Oferente dueño (el controller maneja IDOR internamente)
router.delete('/:id', verifyToken, verifyoferente, servicioController.eliminarServicio);

module.exports = router;