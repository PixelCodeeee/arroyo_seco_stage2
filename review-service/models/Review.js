// review-service/models/Review.js
const promisePool = require('../config/db');
const db = promisePool;

class Review {
    // Crear nueva reseña
static async create(data) {
    const { 
        id_usuario, id_oferente, id_producto, id_servicio,
        id_pedido, id_reserva, compra_verificada, rating, 
        titulo, comentario, status_review = 'publicada' 
    } = data;

    // Convertir undefined a null
    const safeValues = [
        id_usuario ?? null,
        id_oferente ?? null,
        id_producto ?? null,
        id_servicio ?? null,
        id_pedido ?? null,
        id_reserva ?? null,
        compra_verificada ?? false,
        rating ?? null,
        titulo ?? null,
        comentario ?? null,
        status_review ?? 'publicada'
    ];

    console.log('Insertando review con valores:', safeValues);

     const [result] = await promisePool.execute(
            `INSERT INTO review 
                (id_usuario, id_oferente, rating, comentario, status_review) 
             VALUES (?, ?, ?, ?, ?)`,
            [id_usuario, id_oferente, rating, comentario, status_review]
        );

    return this.findById(result.insertId);
}

    // Obtener reseña por ID
    static async findById(id) {
        const [rows] = await promisePool.execute(
            `SELECT r.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo
             FROM review r
             LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
             WHERE r.id_review = ?`,
            [id]
        );
        return rows[0];
    }

    // Obtener reseñas de un oferente
    static async findByOferente(oferenteId, page = 1, limit = 10, rating = null) {
        const offset = (page - 1) * limit;
        let query = `
            SELECT r.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo
            FROM review r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            WHERE r.id_oferente = ? AND r.status_review = 'publicada'
        `;
        let countQuery = `
            SELECT COUNT(*) AS total 
            FROM review 
            WHERE id_oferente = ? AND status_review = 'publicada'
        `;
        const params = [oferenteId];
        
        if (rating) {
            query += ` AND r.rating = ?`;
            countQuery += ` AND rating = ?`;
            params.push(rating);
        }
        
        query += ` ORDER BY r.fecha_creacion DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await promisePool.execute(query, params);
        
        const countParams = rating ? [oferenteId, rating] : [oferenteId];
        const [[{ total }]] = await promisePool.execute(countQuery, countParams);

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

    // Verificar si el usuario ya hizo reseña para este oferente
    static async hasUserReviewed(userId, oferenteId) {
        const [rows] = await promisePool.execute(
            `SELECT id_review FROM review 
             WHERE id_usuario = ? AND id_oferente = ?`,
            [userId, oferenteId]
        );
        return rows.length > 0;
    }

    // Actualizar reseña
    static async update(id, userId, data) {
        const { rating, comentario } = data;

        await promisePool.execute(
            `UPDATE review 
             SET rating = ?, comentario = ?, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id_review = ? AND id_usuario = ?`,
            [rating, comentario, id, userId]
        );

        return this.findById(id);
    }

    // Cambiar estado
    static async updateStatus(id, estado) {
        await promisePool.execute(
            `UPDATE review SET status_review = ? WHERE id_review = ?`,
            [estado, id]
        );
        return this.findById(id);
    }

    // Soft delete
    static async delete(id, userId) {
        const [result] = await promisePool.execute(
            'UPDATE review SET status_review = "eliminada" WHERE id_review = ? AND id_usuario = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    // Obtener reseñas de un usuario
    static async findByUser(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const [rows] = await promisePool.execute(
            `SELECT r.*, o.nombre_negocio AS oferente_nombre
             FROM review r
             LEFT JOIN oferente o ON r.id_oferente = o.id_oferente
             WHERE r.id_usuario = ? AND r.status_review != 'eliminada'
             ORDER BY r.fecha_creacion DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await promisePool.execute(
            'SELECT COUNT(*) AS total FROM review WHERE id_usuario = ? AND status_review != "eliminada"',
            [userId]
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
}

module.exports = Review;