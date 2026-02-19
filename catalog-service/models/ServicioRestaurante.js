const db = require('../config/db');

class ServicioRestaurante {
    static async create(data) {
        const {
            id_oferente,
            nombre,
            descripcion,
            rango_precio,
            capacidad,
            imagenes = [],
            estatus = 1,
        } = data;

        const imagenesJSON = imagenes && imagenes.length > 0 ? JSON.stringify(imagenes) : null;

        const [result] = await db.query(
            `INSERT INTO servicio_restaurante 
       (id_oferente, nombre, descripcion, rango_precio, capacidad, estatus, imagenes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_oferente, nombre, descripcion, rango_precio, capacidad, estatus, imagenesJSON]
        );

        return await this.findById(result.insertId);
    }

    static async findAll() {
        const [rows] = await db.query(`
      SELECT id_servicio, id_oferente, nombre, descripcion, 
             rango_precio, capacidad, estatus, imagenes
      FROM servicio_restaurante
      ORDER BY id_servicio DESC
    `);

        return rows.map(this.parseImagenes);
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM servicio_restaurante WHERE id_servicio = ?`,
            [id]
        );
        if (!rows.length) return null;
        return this.parseImagenes(rows[0]);
    }

    static async findByOfferenteId(oferenteId) {
        const [rows] = await db.query(
            `SELECT * FROM servicio_restaurante WHERE id_oferente = ? ORDER BY id_servicio DESC`,
            [oferenteId]
        );
        return rows.map(this.parseImagenes);
    }

    static parseImagenes(servicio) {
        return {
            ...servicio,
            imagenes: servicio.imagenes
                ? JSON.parse(servicio.imagenes)
                : []
        };
    }

    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
        if (data.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(data.descripcion); }
        if (data.rango_precio !== undefined) { fields.push('rango_precio = ?'); values.push(data.rango_precio); }
        if (data.capacidad !== undefined) { fields.push('capacidad = ?'); values.push(data.capacidad); }
        if (data.estatus !== undefined) { fields.push('estatus = ?'); values.push(data.estatus ? 1 : 0); }
        if (data.imagenes !== undefined) {
            const json = data.imagenes && data.imagenes.length > 0 ? JSON.stringify(data.imagenes) : null;
            fields.push('imagenes = ?');
            values.push(json);
        }

        if (fields.length === 0) return await this.findById(id);

        values.push(id);
        await db.query(`UPDATE servicio_restaurante SET ${fields.join(', ')} WHERE id_servicio = ?`, values);
        return await this.findById(id);
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM servicio_restaurante WHERE id_servicio = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async getStats() {
        const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estatus = 1 THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN estatus = 0 THEN 1 ELSE 0 END) as no_disponibles
      FROM servicio_restaurante
    `);
        return rows[0];
    }
}

module.exports = ServicioRestaurante;
