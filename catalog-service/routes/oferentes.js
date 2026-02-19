const express = require('express');
const router = express.Router();
const oferenteController = require('../controllers/oferenteController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.post('/', verifyToken, oferenteController.crearOferente);
router.get('/', oferenteController.obtenerOferentes);
router.get('/:id', oferenteController.obtenerOferentePorId);
router.get('/usuario/:userId', oferenteController.obtenerOferentePorUsuario);
router.put('/:id', verifyToken, oferenteController.actualizarOferente);
router.delete('/:id', verifyToken, verifyAdmin, oferenteController.eliminarOferente);
router.patch('/:id/estado', verifyToken, verifyAdmin, oferenteController.actualizarEstadoOferente);

module.exports = router;
