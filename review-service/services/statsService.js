// services/statsService.js
const promisePool = require('../config/db');

class StatsService {
    
    async getOferenteStats(oferenteId) {
        try {
            const [rows] = await promisePool.execute(
                `SELECT 
                    COUNT(*) AS total_reviews,
                    AVG(rating) AS avg_rating,
                    MAX(fecha_creacion) AS last_review_date
                 FROM review
                 WHERE id_oferente = ? AND status_review = 'publicada'`,
                [oferenteId]
            );

            const [distribution] = await promisePool.execute(
                `SELECT 
                    rating,
                    COUNT(*) AS count
                 FROM review
                 WHERE id_oferente = ? AND status_review = 'publicada'
                 GROUP BY rating`,
                [oferenteId]
            );

            const ratingDist = { 1:0, 2:0, 3:0, 4:0, 5:0 };
            distribution.forEach(item => {
                ratingDist[item.rating] = parseInt(item.count);
            });

            return {
                total_reviews: parseInt(rows[0]?.total_reviews) || 0,
                avg_rating: parseFloat(rows[0]?.avg_rating) || 0,
                last_review_date: rows[0]?.last_review_date,
                rating_distribution: ratingDist
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                total_reviews: 0,
                avg_rating: 0,
                rating_distribution: {1:0, 2:0, 3:0, 4:0, 5:0}
            };
        }
    }

    async getRecentReviews(limit = 10) {
        try {
            const [rows] = await promisePool.execute(
                `SELECT r.*, u.nombre AS usuario_nombre, o.nombre_negocio
                 FROM review r
                 LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
                 LEFT JOIN oferente o ON r.id_oferente = o.id_oferente
                 WHERE r.status_review = 'publicada'
                 ORDER BY r.fecha_creacion DESC
                 LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('Error obteniendo reviews recientes:', error);
            return [];
        }
    }
}

module.exports = new StatsService();