// controllers/reviewController.js
const Review = require('../models/Review');
const ResponseReview = require('../models/ResponseReview');
const statsService = require('../services/statsService');

const reviewController = {
    // Crear nueva review
    async createReview(req, res) {
        try {
            const userId = req.usuario.id;
            const { id_oferente, rating, comentario } = req.body;

            console.log('Creando review - Body:', req.body);
            console.log('Usuario ID:', userId);

            // Validar datos requeridos
            if (!id_oferente) {
                return res.status(400).json({ 
                    error: 'El ID del oferente es requerido' 
                });
            }

            // Validar rating
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ 
                    error: 'El rating es requerido y debe ser entre 1 y 5' 
                });
            }

            // Verificar si ya hizo review para este oferente
            const yaReview = await Review.hasUserReviewed(userId, id_oferente);
            if (yaReview) {
                return res.status(409).json({ 
                    error: 'Ya has escrito una review para este oferente' 
                });
            }

            // Crear review
            const newReview = await Review.create({
                id_usuario: userId,
                id_oferente,
                rating,
                comentario,
                status_review: 'publicada'
            });

            console.log('Review creada con ID:', newReview.id_review);

            res.status(201).json({
                message: 'Review creada exitosamente',
                review: newReview
            });

        } catch (error) {
            console.error('Error creando review:', error);
            console.error('Stack:', error.stack);
            res.status(500).json({ 
                error: 'Error al crear la review',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Obtener reviews de oferente
    async getOferenteReviews(req, res) {
        try {
            const { id_oferente } = req.params;
            const { page = 1, limit = 10, rating } = req.query;

            const result = await Review.findByOferente(id_oferente, page, limit, rating);
            
            // Obtener respuestas para cada review
            for (const review of result.data) {
                review.respuestas = await ResponseReview.findByReview(review.id_review);
            }

            // Obtener estadísticas
            const stats = await statsService.getOferenteStats(id_oferente);

            res.json({
                ...result,
                stats
            });

        } catch (error) {
            console.error('Error obteniendo reviews:', error);
            res.status(500).json({ error: 'Error al obtener las reviews' });
        }
    },

    // Actualizar review
    async updateReview(req, res) {
        try {
            const { id_review } = req.params;
            const userId = req.usuario.id;
            const { rating, comentario } = req.body;

            const review = await Review.findById(id_review);
            if (!review) {
                return res.status(404).json({ error: 'Review no encontrada' });
            }

            if (review.id_usuario !== userId) {
                return res.status(403).json({ error: 'No tienes permiso para modificar esta review' });
            }

            const updated = await Review.update(id_review, userId, {
                rating, comentario
            });

            res.json({
                message: 'Review actualizada',
                review: updated
            });

        } catch (error) {
            console.error('Error actualizando review:', error);
            res.status(500).json({ error: 'Error al actualizar la review' });
        }
    },

    // Eliminar review
    async deleteReview(req, res) {
        try {
            const { id_review } = req.params;
            const userId = req.usuario.id;

            const review = await Review.findById(id_review);
            if (!review) {
                return res.status(404).json({ error: 'Review no encontrada' });
            }

            if (review.id_usuario !== userId) {
                return res.status(403).json({ error: 'No tienes permiso' });
            }

            await Review.delete(id_review, userId);

            res.json({ message: 'Review eliminada correctamente' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar la review' });
        }
    },

    // Obtener mis reviews
    async getMyReviews(req, res) {
        try {
            const userId = req.usuario.id;
            const { page = 1, limit = 10 } = req.query;

            const result = await Review.findByUser(userId, page, limit);
            res.json(result);

        } catch (error) {
            console.error('Error obteniendo mis reviews:', error);
            res.status(500).json({ error: 'Error al obtener tus reviews' });
        }
    }
};

module.exports = reviewController;