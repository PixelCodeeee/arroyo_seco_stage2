const db = require('../config/db');

class Producto {

    static parseImagenes(p) {
        let imgs = [];

        if (Array.isArray(p.imagenes)) {
            imgs = p.imagenes;
        } else if (typeof p.imagenes === "string") {
            try {
                const parsed = JSON.parse(p.imagenes);
                if (Array.isArray(parsed)) imgs = parsed;
            } catch {
                imgs = [];
            }
        }

        return { ...p, imagenes: imgs };
    }


    static async create(data) {
        const {
            id_oferente,
            nombre,
            descripcion,
            precio,
            inventario = 0,
            imagenes = [],
            estatus = 1,
            id_categoria
        } = data;

        const imagenesJSON = imagenes && imagenes.length > 0
            ? JSON.stringify(imagenes)
            : null;

        const [result] = await db.query(
            `INSERT INTO producto 
      (id_oferente, nombre, descripcion, precio, inventario, imagenes, estatus, id_categoria)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_oferente,
                nombre,
                descripcion || null,
                precio,
                inventario,
                imagenesJSON,
                estatus,
                id_categoria
            ]
        );

        return this.findById(result.insertId);
    }

    static async findAll() {
        const [rows] = await db.query(`
      SELECT p.*, c.nombre as nombre_categoria, c.tipo as tipo_categoria
      FROM producto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      ORDER BY p.id_producto DESC
    `);
        return rows.map(this.parseImagenes);
    }

    static async findById(id) {
        const [rows] = await db.query(`
      SELECT p.*, c.nombre as nombre_categoria, c.tipo as tipo_categoria
      FROM producto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = ?
    `, [id]);

        return rows.length ? this.parseImagenes(rows[0]) : null;
    }

    static async findByOferente(id_oferente) {
        const [rows] = await db.query(`
      SELECT p.*, c.nombre as nombre_categoria, c.tipo as tipo_categoria
      FROM producto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE p.id_oferente = ?
      ORDER BY p.id_producto DESC
    `, [id_oferente]);

        return rows.map(this.parseImagenes);
    }

    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
        if (data.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(data.descripcion); }
        if (data.precio !== undefined) { fields.push('precio = ?'); values.push(data.precio); }
        if (data.inventario !== undefined) { fields.push('inventario = ?'); values.push(data.inventario); }
        if (data.estatus !== undefined) { fields.push('estatus = ?'); values.push(data.estatus ? 1 : 0); }
        if (data.id_categoria !== undefined) { fields.push('id_categoria = ?'); values.push(data.id_categoria); }

        if (data.imagenes !== undefined) {
            const json = data.imagenes.length > 0 ? JSON.stringify(data.imagenes) : null;
            fields.push('imagenes = ?');
            values.push(json);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);

        await db.query(
            `UPDATE producto SET ${fields.join(', ')} WHERE id_producto = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await db.query(
            `DELETE FROM producto WHERE id_producto = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Producto;
