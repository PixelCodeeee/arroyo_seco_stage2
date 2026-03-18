// models/ReportReview.js
const promisePool = require('../config/db');

class ReportReview {
    // Crear reporte
    static async create(data) {
        const { id_review, id_usuario_reporta, motivo } = data;

        // Validar que el motivo sea uno de los permitidos
        const motivosPermitidos = ['ofensivo', 'spam', 'falso', 'otro'];
        if (!motivosPermitidos.includes(motivo)) {
            throw new Error(`Motivo debe ser uno de: ${motivosPermitidos.join(', ')}`);
        }

        const [result] = await promisePool.execute(
            `INSERT INTO review_report 
                (id_review, id_usuario_reporta, motivo) 
             VALUES (?, ?, ?)`,
            [id_review, id_usuario_reporta, motivo]
        );

        return this.findById(result.insertId);
    }

    // Obtener reporte por ID
    static async findById(id) {
        const [rows] = await promisePool.execute(
            `SELECT rr.*, 
                    u.nombre AS usuario_nombre,
                    r.comentario AS review_comentario,
                    r.rating AS review_rating
             FROM review_report rr
             LEFT JOIN usuario u ON rr.id_usuario_reporta = u.id_usuario
             LEFT JOIN review r ON rr.id_review = r.id_review
             WHERE rr.id_review_report = ?`,
            [id]
        );
        return rows[0];
    }

    // Obtener reportes pendientes
    static async getPending(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await promisePool.execute(
            `SELECT rr.*, 
                    u.nombre AS usuario_nombre,
                    r.comentario AS review_comentario,
                    r.rating AS review_rating
             FROM review_report rr
             LEFT JOIN usuario u ON rr.id_usuario_reporta = u.id_usuario
             LEFT JOIN review r ON rr.id_review = r.id_review
             WHERE rr.estado_reporte = 'pendiente'
             ORDER BY rr.fecha_creacion ASC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await promisePool.execute(
            'SELECT COUNT(*) AS total FROM review_report WHERE estado_reporte = "pendiente"'
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Resolver reporte (marcar como resuelto)
    static async resolve(id) {
        await promisePool.execute(
            `UPDATE review_report 
             SET estado_reporte = 'resuelto'
             WHERE id_review_report = ?`,
            [id]
        );

        return this.findById(id);
    }

    // Verificar si un usuario ya reportó una review
    static async hasUserReported(reviewId, userId) {
        const [rows] = await promisePool.execute(
            'SELECT id_review_report FROM review_report WHERE id_review = ? AND id_usuario_reporta = ?',
            [reviewId, userId]
        );
        return rows.length > 0;
    }
}

module.exports = ReportReview;