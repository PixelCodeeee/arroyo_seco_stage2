const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verifyToken, verifyAdmin, verifyoferente } = require('../middleware/auth');

const injectOferenteIfNeeded = async (req, res, next) => {
    if (req.user?.rol === 'oferente') return verifyoferente(req, res, next);
    next();
};

// Public
router.get('/disponibilidad', reservaController.verificarDisponibilidad);
router.get('/recomendaciones/top-servicios', reservaController.getTopServicios);

// Static named routes BEFORE /:id
router.get('/analiticas/stats', verifyToken, reservaController.getStatsAnaliticas);
router.get('/usuario/:usuarioId', verifyToken, reservaController.obtenerReservasPorUsuario);
router.get('/oferente/:oferenteId', verifyToken, verifyoferente, reservaController.obtenerReservasPorOferente);

// Wildcard /:id last
router.get('/:id', verifyToken, injectOferenteIfNeeded, reservaController.obtenerReservaPorId);

router.post('/', verifyToken, reservaController.crearReserva);
router.get('/', verifyToken, injectOferenteIfNeeded, reservaController.obtenerReservas);
router.put('/:id', verifyToken, injectOferenteIfNeeded, reservaController.actualizarReserva);
router.patch('/:id/estado', verifyToken, injectOferenteIfNeeded, reservaController.cambiarEstado);
router.delete('/:id', verifyToken, reservaController.eliminarReserva);

module.exports = router;