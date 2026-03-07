const db = require('../config/db');

class Reserva {
    // Crear reserva con validaciones de unicidad
    static async create(data) {
        const {
            id_usuario,
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado = 'pendiente',
            notas = null
        } = data;

        // Validar que no exista reserva para el mismo usuario en la misma fecha
        const [existeUsuarioFecha] = await db.query(
            `SELECT id_reserva FROM reserva 
             WHERE id_usuario = ? AND fecha = ?`,
            [id_usuario, fecha]
        );

        if (existeUsuarioFecha.length > 0) {
            throw new Error('Ya existe una reserva para este usuario en esta fecha');
        }

        // Validar que no existan dos reservas para el mismo servicio en la misma fecha y hora
        const [existeServicioFechaHora] = await db.query(
            `SELECT id_reserva FROM reserva 
             WHERE id_servicio = ? AND fecha = ? AND hora = ?`,
            [id_servicio, fecha, hora]
        );

        if (existeServicioFechaHora.length > 0) {
            throw new Error('Ya existe una reserva para este servicio en esta fecha y hora');
        }

        const [result] = await db.query(
            `INSERT INTO reserva 
             (id_usuario, id_servicio, fecha, hora, numero_personas, estado, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_usuario, id_servicio, fecha, hora, numero_personas, estado, notas]
        );

        return await this.findById(result.insertId);
    }

    // Obtener todas las reservas con información relacionada
    static async findAll() {
        const [rows] = await db.query(`
            SELECT 
                r.*,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                s.nombre as nombre_servicio,
                o.nombre_negocio as nombre_oferente
            FROM reserva r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            LEFT JOIN servicio_restaurante s ON r.id_servicio = s.id_servicio
            LEFT JOIN oferente o ON s.id_oferente = o.id_oferente
            ORDER BY r.fecha DESC, r.hora DESC
        `);
        return rows;
    }

    // Obtener reserva por ID
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT 
                r.*,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                s.nombre as nombre_servicio,
                o.nombre_negocio as nombre_oferente,
                o.id_oferente
            FROM reserva r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            LEFT JOIN servicio_restaurante s ON r.id_servicio = s.id_servicio
            LEFT JOIN oferente o ON s.id_oferente = o.id_oferente
            WHERE r.id_reserva = ?`,
            [id]
        );
        return rows.length ? rows[0] : null;
    }

    // Obtener reservas por usuario
    static async findByUsuarioId(usuarioId) {
        const [rows] = await db.query(
            `SELECT 
                r.*,
                s.nombre as nombre_servicio,
                s.rango_precio,
                o.nombre_negocio as nombre_oferente
            FROM reserva r
            LEFT JOIN servicio_restaurante s ON r.id_servicio = s.id_servicio
            LEFT JOIN oferente o ON s.id_oferente = o.id_oferente
            WHERE r.id_usuario = ?
            ORDER BY r.fecha DESC, r.hora DESC`,
            [usuarioId]
        );
        return rows;
    }

    // Obtener reservas por servicio
    static async findByServicioId(servicioId) {
        const [rows] = await db.query(
            `SELECT 
                r.*,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                u.telefono as telefono_usuario
            FROM reserva r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            WHERE r.id_servicio = ?
            ORDER BY r.fecha DESC, r.hora DESC`,
            [servicioId]
        );
        return rows;
    }

    // Obtener reservas por oferente (útil para que el oferente vea sus reservas)
    static async findByOferenteId(oferenteId) {
        const [rows] = await db.query(
            `SELECT 
                r.*,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                u.telefono as telefono_usuario,
                s.nombre as nombre_servicio
            FROM reserva r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            LEFT JOIN servicio_restaurante s ON r.id_servicio = s.id_servicio
            WHERE s.id_oferente = ?
            ORDER BY r.fecha DESC, r.hora DESC`,
            [oferenteId]
        );
        return rows;
    }

    // Obtener reservas por estado
    static async findByEstado(estado) {
        const [rows] = await db.query(
            `SELECT 
                r.*,
                u.nombre as nombre_usuario,
                s.nombre as nombre_servicio
            FROM reserva r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            LEFT JOIN servicio_restaurante s ON r.id_servicio = s.id_servicio
            WHERE r.estado = ?
            ORDER BY r.fecha DESC, r.hora DESC`,
            [estado]
        );
        return rows;
    }

    // Actualizar reserva con validaciones
    static async update(id, data) {
        const fields = [];
        const values = [];

        // Obtener reserva actual
        const reservaActual = await this.findById(id);
        if (!reservaActual) return null;

        // Si se actualiza fecha, validar que el usuario no tenga otra reserva en esa fecha
        if (data.fecha !== undefined && data.fecha !== reservaActual.fecha) {
            const [existeUsuarioFecha] = await db.query(
                `SELECT id_reserva FROM reserva 
                 WHERE id_usuario = ? AND fecha = ? AND id_reserva != ?`,
                [reservaActual.id_usuario, data.fecha, id]
            );

            if (existeUsuarioFecha.length > 0) {
                throw new Error('Ya existe una reserva para este usuario en esta fecha');
            }
        }

        // Si se actualiza servicio, fecha u hora, validar disponibilidad
        const nuevaFecha = data.fecha !== undefined ? data.fecha : reservaActual.fecha;
        const nuevaHora = data.hora !== undefined ? data.hora : reservaActual.hora;
        const nuevoServicio = data.id_servicio !== undefined ? data.id_servicio : reservaActual.id_servicio;

        if (data.fecha !== undefined || data.hora !== undefined || data.id_servicio !== undefined) {
            const [existeServicioFechaHora] = await db.query(
                `SELECT id_reserva FROM reserva 
                 WHERE id_servicio = ? AND fecha = ? AND hora = ? AND id_reserva != ?`,
                [nuevoServicio, nuevaFecha, nuevaHora, id]
            );

            if (existeServicioFechaHora.length > 0) {
                throw new Error('Ya existe una reserva para este servicio en esta fecha y hora');
            }
        }

        // Construir query de actualización
        if (data.id_servicio !== undefined) { fields.push('id_servicio = ?'); values.push(data.id_servicio); }
        if (data.fecha !== undefined) { fields.push('fecha = ?'); values.push(data.fecha); }
        if (data.hora !== undefined) { fields.push('hora = ?'); values.push(data.hora); }
        if (data.numero_personas !== undefined) { fields.push('numero_personas = ?'); values.push(data.numero_personas); }
        if (data.estado !== undefined) { fields.push('estado = ?'); values.push(data.estado); }
        if (data.notas !== undefined) { fields.push('notas = ?'); values.push(data.notas); }

        if (fields.length === 0) return await this.findById(id);

        values.push(id);
        await db.query(
            `UPDATE reserva SET ${fields.join(', ')} WHERE id_reserva = ?`,
            values
        );

        return await this.findById(id);
    }

    // Actualizar solo el estado
    static async updateEstado(id, estado) {
        const [result] = await db.query(
            `UPDATE reserva SET estado = ? WHERE id_reserva = ?`,
            [estado, id]
        );

        if (result.affectedRows === 0) return null;
        return await this.findById(id);
    }

    // Eliminar reserva
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM reserva WHERE id_reserva = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Estadísticas de reservas
    static async getStats() {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
                SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas
            FROM reserva
        `);
        return rows[0];
    }

    // Verificar disponibilidad (útil antes de crear)
    static async checkDisponibilidad(id_servicio, fecha, hora) {
        const [rows] = await db.query(
            `SELECT id_reserva FROM reserva 
             WHERE id_servicio = ? AND fecha = ? AND hora = ? AND estado != 'cancelada'`,
            [id_servicio, fecha, hora]
        );
        return rows.length === 0;
    }

    // Top servicios más reservados (para recomendaciones)
    static async getTopServicios(limit = 10) {
        const [rows] = await db.query(`
            SELECT
                s.id_servicio,
                s.nombre as nombre_servicio,
                s.descripcion,
                s.rango_precio,
                s.capacidad,
                s.imagenes,
                o.id_oferente,
                o.nombre_negocio,
                o.tipo as tipo_oferente,
                COUNT(r.id_reserva) as total_reservas,
                COUNT(DISTINCT r.id_usuario) as total_visitantes
            FROM reserva r
            INNER JOIN servicio_restaurante s ON r.id_servicio = s.id_servicio
            INNER JOIN oferente o ON s.id_oferente = o.id_oferente
            WHERE r.estado IN ('confirmada', 'pendiente')
            AND r.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY s.id_servicio
            ORDER BY total_reservas DESC
            LIMIT ?
        `, [limit]);

        return rows.map(row => ({
            ...row,
            imagenes: (() => {
                try { return typeof row.imagenes === 'string' ? JSON.parse(row.imagenes) : (row.imagenes || []); }
                catch { return []; }
            })()
        }));
    }

    // Stats completos para analíticas
static async getStatsAnaliticas() {
    const [stats] = await db.query(`
        SELECT
            COUNT(*) as total_reservas,
            SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
            SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
            SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
            SUM(numero_personas) as total_personas
        FROM reserva
        WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [reservasPorMes] = await db.query(`
        SELECT
            DATE_FORMAT(fecha_creacion, '%Y-%m') as mes,
            DATE_FORMAT(fecha_creacion, '%b %Y') as mes_label,
            COUNT(*) as total_reservas
        FROM reserva
        WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m'), DATE_FORMAT(fecha_creacion, '%b %Y')
        ORDER BY mes ASC
    `);

    return { ...stats[0], reservasPorMes };
}
}

module.exports = Reserva;
