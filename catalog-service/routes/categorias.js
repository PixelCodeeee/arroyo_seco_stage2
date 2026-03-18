const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { verifyToken, verifyAdmin, verifyoferente } = require('../middleware/auth');

// Public
router.get('/', categoriaController.obtenerCategorias);

// Protected
router.post('/', verifyToken, verifyoferente, categoriaController.crearCategoria); // Or admin?
router.put('/:id', verifyToken, verifyAdmin, categoriaController.actualizarCategoria);
router.delete('/:id', verifyToken, verifyAdmin, categoriaController.eliminarCategoria);

module.exports = router;
