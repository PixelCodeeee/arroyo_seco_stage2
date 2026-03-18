// models/Business.js
const promisePool = require('../config/db');

class Business {
    // Obtener negocio por ID
    static async findById(id) {
        const [rows] = await promisePool.execute(
            `SELECT o.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo
             FROM oferente o
             LEFT JOIN usuario u ON o.id_usuario = u.id_usuario
             WHERE o.id_oferente = ?`,
            [id]
        );
        return rows[0];
    }

    // Obtener negocio por ID de usuario
    static async findByUserId(userId) {
        const [rows] = await promisePool.execute(
            'SELECT * FROM oferente WHERE id_usuario = ?',
            [userId]
        );
        return rows[0];
    }

    // Verificar si un usuario es dueño del negocio
    static async verifyOwnership(oferenteId, userId) {
        const [rows] = await promisePool.execute(
            'SELECT id_oferente FROM oferente WHERE id_oferente = ? AND id_usuario = ?',
            [oferenteId, userId]
        );
        return rows.length > 0;
    }

    // Obtener estadísticas del negocio
    static async getStats(oferenteId) {
        const [rows] = await promisePool.execute(
            `SELECT 
                COUNT(DISTINCT r.id_review) AS total_reviews,
                AVG(r.rating) AS avg_rating,
                COUNT(DISTINCT rr.id_review_report) AS total_reports,
                COUNT(DISTINCT rs.id_review_response) AS total_responses
             FROM oferente o
             LEFT JOIN review r ON o.id_oferente = r.id_oferente AND r.status_review = 'publicada'
             LEFT JOIN review_report rr ON r.id_review = rr.id_review
             LEFT JOIN review_response rs ON r.id_review = rs.id_review
             WHERE o.id_oferente = ?`,
            [oferenteId]
        );
        
        return {
            total_reviews: parseInt(rows[0]?.total_reviews) || 0,
            avg_rating: parseFloat(rows[0]?.avg_rating) || 0,
            total_reports: parseInt(rows[0]?.total_reports) || 0,
            total_responses: parseInt(rows[0]?.total_responses) || 0
        };
    }
}

module.exports = Business;