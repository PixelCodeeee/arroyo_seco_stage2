const { promisePool: db } = require('../config/db');

class Oferente {

    // Crear oferente
    static async create(oferenteData) {
        const { id_usuario, nombre_negocio, direccion, tipo, horario_disponibilidad, imagen, telefono } = oferenteData;

        const tiposValidos = ['restaurante', 'artesanal'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error('Tipo debe ser "restaurante" o "artesanal"');
        }

        const horarioJSON = typeof horario_disponibilidad === 'object'
            ? JSON.stringify(horario_disponibilidad)
            : horario_disponibilidad;

        const [result] = await db.query(
            `INSERT INTO oferente 
            (id_usuario, nombre_negocio, direccion, tipo, horario_disponibilidad, imagen, telefono) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_usuario, nombre_negocio, direccion, tipo, horarioJSON, imagen || null, telefono || null]
        );

        return await this.findById(result.insertId);
    }


    // Obtener todos
    static async findAll() {
        const [oferentes] = await db.query(`
            SELECT 
                o.id_oferente,
                o.id_usuario,
                o.nombre_negocio,
                o.direccion,
                o.tipo,
                o.estado,
                o.horario_disponibilidad,
                o.imagen,
                o.telefono,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario
            FROM oferente o
            INNER JOIN usuario u ON o.id_usuario = u.id_usuario
            ORDER BY o.id_oferente DESC
        `);

        return oferentes.map(o => ({
            ...o,
            horario_disponibilidad: typeof o.horario_disponibilidad === 'string'
                ? JSON.parse(o.horario_disponibilidad)
                : o.horario_disponibilidad
        }));
    }


    // Filtros
    static async findAllWithFilters({ estado, tipo }) {
        let query = `
            SELECT 
                o.id_oferente,
                o.id_usuario,
                o.nombre_negocio,
                o.direccion,
                o.tipo,
                o.estado,
                o.horario_disponibilidad,
                o.imagen,
                o.telefono,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario
            FROM oferente o
            INNER JOIN usuario u ON o.id_usuario = u.id_usuario
            WHERE 1=1
        `;

        const params = [];

        if (estado) {
            query += ' AND o.estado = ?';
            params.push(estado);
        }

        if (tipo) {
            query += ' AND o.tipo = ?';
            params.push(tipo);
        }

        query += ' ORDER BY o.id_oferente DESC';

        const [oferentes] = await db.query(query, params);

        return oferentes.map(o => ({
            ...o,
            horario_disponibilidad: typeof o.horario_disponibilidad === 'string'
                ? JSON.parse(o.horario_disponibilidad)
                : o.horario_disponibilidad
        }));
    }


    // Buscar por ID
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT 
                o.id_oferente,
                o.id_usuario,
                o.nombre_negocio,
                o.direccion,
                o.tipo,
                o.estado,
                o.horario_disponibilidad,
                o.imagen,
                o.telefono,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario
            FROM oferente o
            INNER JOIN usuario u ON o.id_usuario = u.id_usuario
            WHERE o.id_oferente = ?
        `, [id]);

        if (rows.length === 0) return null;

        const oferente = rows[0];

        if (oferente.horario_disponibilidad && typeof oferente.horario_disponibilidad === 'string') {
            try {
                oferente.horario_disponibilidad = JSON.parse(oferente.horario_disponibilidad);
            } catch (e) {
                console.error('Error parsing horario_disponibilidad:', e);
                oferente.horario_disponibilidad = null;
            }
        }

        return oferente;
    }


    // Buscar por usuario
    static async findByUserId(userId) {
        const [rows] = await db.query(`
            SELECT 
                o.id_oferente,
                o.id_usuario,
                o.nombre_negocio,
                o.direccion,
                o.tipo,
                o.estado,
                o.horario_disponibilidad,
                o.imagen,
                o.telefono
            FROM oferente o
            WHERE o.id_usuario = ?
        `, [userId]);

        if (rows.length === 0) return null;

        const oferente = rows[0];

        if (oferente.horario_disponibilidad && typeof oferente.horario_disponibilidad === 'string') {
            try {
                oferente.horario_disponibilidad = JSON.parse(oferente.horario_disponibilidad);
            } catch (e) {
                console.error('Error parsing horario_disponibilidad:', e);
                oferente.horario_disponibilidad = null;
            }
        }

        return oferente;
    }


    // Update general
    static async update(id, data) {
        const { nombre_negocio, direccion, tipo, horario_disponibilidad, imagen, telefono } = data;

        let fields = [];
        let values = [];

        if (nombre_negocio !== undefined) {
            fields.push('nombre_negocio = ?');
            values.push(nombre_negocio);
        }

        if (direccion !== undefined) {
            fields.push('direccion = ?');
            values.push(direccion);
        }

        if (tipo !== undefined) {
            const tiposValidos = ['restaurante', 'artesanal'];
            if (!tiposValidos.includes(tipo)) {
                throw new Error('Tipo debe ser "restaurante" o "artesanal"');
            }
            fields.push('tipo = ?');
            values.push(tipo);
        }

        if (horario_disponibilidad !== undefined) {
            const horarioJSON = typeof horario_disponibilidad === 'object'
                ? JSON.stringify(horario_disponibilidad)
                : horario_disponibilidad;
            fields.push('horario_disponibilidad = ?');
            values.push(horarioJSON);
        }

        if (imagen !== undefined) {
            fields.push('imagen = ?');
            values.push(imagen);
        }

        if (telefono !== undefined) {
            fields.push('telefono = ?');
            values.push(telefono);
        }

        if (fields.length === 0) return null;

        values.push(id);

        await db.query(
            `UPDATE oferente SET ${fields.join(', ')} WHERE id_oferente = ?`,
            values
        );

        return await this.findById(id);
    }


    // Update estado (pendiente/aprobado/suspendido)
    static async updateEstado(id, estado) {
        const estadosValidos = ['pendiente', 'aprobado', 'suspendido'];
        if (!estadosValidos.includes(estado)) {
            throw new Error('Estado inválido');
        }

        await db.query(
            `UPDATE oferente SET estado = ? WHERE id_oferente = ?`,
            [estado, id]
        );

        return await this.findById(id);
    }


    // Update imagen específico
    static async updateImagen(id, imagenUrl) {
        await db.query(
            'UPDATE oferente SET imagen = ? WHERE id_oferente = ?',
            [imagenUrl, id]
        );
        return await this.findById(id);
    }


    // Eliminar
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM oferente WHERE id_oferente = ?',
            [id]
        );

        return result.affectedRows > 0;
    }
}

module.exports = Oferente;
