// review-service/middleware/roles.js
const Review = require('../models/Review');
const promisePool = require('../config/db');

const verifyReviewOwnership = async (req, res, next) => {
    try {
        const userId = req.usuario.id;
        const reviewId = req.params.id_review;

        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ error: 'Review no encontrada' });
        }

        if (review.id_usuario !== userId && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta review' });
        }

        req.review = review;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error verificando propiedad' });
    }
};

const verifyCanRespond = async (req, res, next) => {
    try {
        const userId = req.usuario.id; // Usar el ID del usuario del token
        const reviewId = req.params.id_review;

        console.log('Verificando permisos para responder:');
        console.log('- User ID:', userId);
        console.log('- Review ID:', reviewId);

        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ error: 'Review no encontrada' });
        }

        // BUSCAR EN LA BASE DE DATOS los oferentes de este usuario
        const [ownerRows] = await promisePool.query(
            'SELECT id_oferente FROM oferente WHERE id_usuario = ?',
            [userId]
        );

        console.log('- Oferentes del usuario:', ownerRows.map(o => o.id_oferente));
        console.log('- Oferente de la review:', review.id_oferente);

        // Verificar si el usuario es dueño del oferente
        const esDueno = ownerRows.some(o => o.id_oferente === review.id_oferente);

        if (!esDueno) {
            return res.status(403).json({ 
                error: 'Esta review no pertenece a tu negocio',
                debug: {
                    userId,
                    tusOferentes: ownerRows.map(o => o.id_oferente),
                    oferenteRequerido: review.id_oferente
                }
            });
        }

        req.review = review;
        next();
    } catch (error) {
        console.error('Error en verifyCanRespond:', error);
        res.status(500).json({ error: 'Error verificando permisos' });
    }
};

module.exports = {
    verifyReviewOwnership,
    verifyCanRespond
};