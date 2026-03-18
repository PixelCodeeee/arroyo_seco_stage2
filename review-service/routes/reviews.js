// reviews.js - Versión corregida
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController.js');
const { verifyToken, requireCliente } = require('../middleware/auth');

// Middleware de autenticación - Solo para debugging
router.use((req, res, next) => {
    console.log('Reviews Route - Headers:', req.headers);
    next();
});

// Rutas protegidas
router.post('/', verifyToken, requireCliente, reviewController.createReview);
router.get('/mis-reviews', verifyToken, reviewController.getMyReviews);
router.put('/:id_review', verifyToken, requireCliente, reviewController.updateReview);
router.delete('/:id_review', verifyToken, requireCliente, reviewController.deleteReview);

// Rutas públicas (requieren token pero no rol específico)
router.get('/oferente/:id_oferente', verifyToken, reviewController.getOferenteReviews);

module.exports = router;