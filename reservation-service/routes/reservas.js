const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verifyToken, verifyAdmin, verifyoferente } = require('../middleware/auth');

// Public availability check
router.get('/disponibilidad', reservaController.verificarDisponibilidad);

// Protected routes
router.post('/', verifyToken, reservaController.crearReserva);
router.get('/', verifyToken, verifyAdmin, reservaController.obtenerReservas);
router.get('/:id', verifyToken, reservaController.obtenerReservaPorId); // Check ownership in controller ideally
router.get('/usuario/:usuarioId', verifyToken, reservaController.obtenerReservasPorUsuario);
router.get('/oferente/:oferenteId', verifyToken, verifyoferente, reservaController.obtenerReservasPorOferente);
router.put('/:id', verifyToken, reservaController.actualizarReserva); // User or Admin?
router.patch('/:id/estado', verifyToken, verifyAdmin, reservaController.cambiarEstado); // Admin or Oferente? Usually Oferente accepts/rejects.
router.delete('/:id', verifyToken, reservaController.eliminarReserva);

module.exports = router;
