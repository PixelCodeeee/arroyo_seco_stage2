const express = require('express');
const router = express.Router();
const oferenteController = require('../controllers/oferenteController');
const { verifyToken, verifyAdmin, verifyAdminOrModerador } = require('../middleware/auth');

router.post('/', verifyToken, oferenteController.crearOferente);
router.get('/', oferenteController.obtenerOferentes);
router.get('/usuario/:userId', oferenteController.obtenerOferentePorUsuario);
router.get('/:id', oferenteController.obtenerOferentePorId);
router.put('/:id', verifyToken, oferenteController.actualizarOferente);

// Solo Admin
router.delete('/:id', verifyToken, verifyAdmin, oferenteController.eliminarOferente);

// Admin o Moderador
router.patch('/:id/estado', verifyToken, verifyAdminOrModerador, oferenteController.actualizarEstadoOferente);

module.exports = router;