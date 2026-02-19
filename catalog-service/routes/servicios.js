const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const { verifyToken, verifyoferente } = require('../middleware/auth');

// Public
router.get('/', servicioController.obtenerServicios);
router.get('/:id', servicioController.obtenerServicioPorId);
router.get('/oferente/:oferenteId', servicioController.obtenerServiciosPorOferente);

// Protected
router.post('/', verifyToken, verifyoferente, servicioController.crearServicio);
router.put('/:id', verifyToken, verifyoferente, servicioController.actualizarServicio);
router.delete('/:id', verifyToken, verifyoferente, servicioController.eliminarServicio);

module.exports = router;
