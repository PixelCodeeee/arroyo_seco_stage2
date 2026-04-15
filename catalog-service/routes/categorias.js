const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { verifyToken, verifyAdmin, verifyAdminOrModerador } = require('../middleware/auth');

// Public
router.get('/', categoriaController.obtenerCategorias);

// Admin o Moderador
router.post('/', verifyToken, verifyAdminOrModerador, categoriaController.crearCategoria);
router.put('/:id', verifyToken, verifyAdminOrModerador, categoriaController.actualizarCategoria);

// Solo Admin
router.delete('/:id', verifyToken, verifyAdmin, categoriaController.eliminarCategoria);

module.exports = router;