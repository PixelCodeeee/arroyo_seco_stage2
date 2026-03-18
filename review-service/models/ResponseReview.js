// review-service/models/ResponseReview.js
const promisePool = require('../config/db');

class ResponseReview {
    // Crear respuesta
    static async create(data) {
        const { id_review, id_oferente, mensaje } = data;

        const [result] = await promisePool.execute(
            `INSERT INTO review_response 
                (id_review, id_oferente, mensaje) 
             VALUES (?, ?, ?)`,
            [id_review, id_oferente, mensaje]
        );

        return this.findById(result.insertId);
    }

    // Obtener respuesta por ID
    static async findById(id) {
        const [rows] = await promisePool.execute(
            `SELECT rr.*, o.nombre_negocio AS oferente_nombre
             FROM review_response rr
             LEFT JOIN oferente o ON rr.id_oferente = o.id_oferente
             WHERE rr.id_review_response = ?`,
            [id]
        );
        return rows[0];
    }

    // Obtener respuesta por review
    static async findByReview(reviewId) {
        const [rows] = await promisePool.execute(
            `SELECT rr.*, o.nombre_negocio AS oferente_nombre
             FROM review_response rr
             LEFT JOIN oferente o ON rr.id_oferente = o.id_oferente
             WHERE rr.id_review = ?
             ORDER BY rr.fecha_creacion DESC`,
            [reviewId]
        );
        return rows;
    }

    // ACTUALIZAR respuesta - (sin fecha_actualizacion)
    static async update(id, oferenteId, mensaje) {
        await promisePool.execute(
            `UPDATE review_response 
             SET mensaje = ?
             WHERE id_review_response = ? AND id_oferente = ?`,
            [mensaje, id, oferenteId]
        );

        return this.findById(id);
    }

    // Eliminar respuesta
    static async delete(id, oferenteId, isAdmin = false) {
        if (isAdmin) {
            const [result] = await promisePool.execute(
                'DELETE FROM review_response WHERE id_review_response = ?',
                [id]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await promisePool.execute(
                'DELETE FROM review_response WHERE id_review_response = ? AND id_oferente = ?',
                [id, oferenteId]
            );
            return result.affectedRows > 0;
        }
    }

    // Verificar si ya existe respuesta para una review
    static async exists(reviewId) {
        const [rows] = await promisePool.execute(
            'SELECT id_review_response FROM review_response WHERE id_review = ?',
            [reviewId]
        );
        return rows.length > 0;
    }
}

module.exports = ResponseReview;