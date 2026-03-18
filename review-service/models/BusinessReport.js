// models/BusinessReport.js
const promisePool = require('../config/db');

class BusinessReport {
    // Crear reporte de oferente
    static async create(data) {
        const { id_oferente, id_usuario_reporta, motivo, comentario } = data;

        const [result] = await promisePool.execute(
            `INSERT INTO business_report 
                (id_oferente, id_usuario_reporta, motivo, comentario) 
             VALUES (?, ?, ?, ?)`,
            [id_oferente, id_usuario_reporta, motivo, comentario]
        );

        return this.findById(result.insertId);
    }

    // Obtener reporte por ID
    static async findById(id) {
        const [rows] = await promisePool.execute(
            `SELECT br.*, 
                    u.nombre AS reporter_nombre,
                    o.nombre_negocio AS business_nombre,
                    o.id_usuario AS business_owner_id
             FROM business_report br
             LEFT JOIN usuario u ON br.id_usuario_reporta = u.id_usuario
             LEFT JOIN oferente o ON br.id_oferente = o.id_oferente
             WHERE br.id_business_report = ?`,
            [id]
        );
        return rows[0];
    }

    // Obtener reportes pendientes
    static async getPending(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await promisePool.execute(
            `SELECT br.*, 
                    u.nombre AS reporter_nombre,
                    o.nombre_negocio AS business_nombre
             FROM business_report br
             LEFT JOIN usuario u ON br.id_usuario_reporta = u.id_usuario
             LEFT JOIN oferente o ON br.id_oferente = o.id_oferente
             WHERE br.estado_reporte = 'pendiente'
             ORDER BY br.fecha_creacion ASC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await promisePool.execute(
            'SELECT COUNT(*) AS total FROM business_report WHERE estado_reporte = "pendiente"'
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

    // Actualizar estado del reporte
    static async updateStatus(id, adminId, estado, comentario = null) {
        await promisePool.execute(
            `UPDATE business_report 
             SET estado_reporte = ?, id_admin_revisa = ?, 
                 fecha_revision = CURRENT_TIMESTAMP, comentario_admin = ?
             WHERE id_business_report = ?`,
            [estado, adminId, comentario, id]
        );

        return this.findById(id);
    }

    // Verificar si un usuario ya reportó este negocio
    static async hasUserReported(businessId, userId) {
        const [rows] = await promisePool.execute(
            'SELECT id_business_report FROM business_report WHERE id_oferente = ? AND id_usuario_reporta = ?',
            [businessId, userId]
        );
        return rows.length > 0;
    }

    // Obtener todos los reportes de un negocio
    static async findByBusiness(businessId) {
        const [rows] = await promisePool.execute(
            `SELECT br.*, u.nombre AS reporter_nombre
             FROM business_report br
             LEFT JOIN usuario u ON br.id_usuario_reporta = u.id_usuario
             WHERE br.id_oferente = ?
             ORDER BY br.fecha_creacion DESC`,
            [businessId]
        );
        return rows;
    }
}

module.exports = BusinessReport;