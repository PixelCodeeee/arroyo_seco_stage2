const db = require('../config/db');

class Categoria {
    static async create({ nombre, tipo }) {
        const tiposValidos = ['gastronomica', 'artesanal'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error('Tipo debe ser "gastronomica" o "artesanal"');
        }

        const [result] = await db.query(
            'INSERT INTO categoria (nombre, tipo) VALUES (?, ?)',
            [nombre.trim(), tipo]
        );

        return this.findById(result.insertId);
    }

    static async findAll() {
        const [rows] = await db.query(`
      SELECT id_categoria, nombre, tipo 
      FROM categoria 
      ORDER BY tipo DESC, nombre ASC
    `);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM categoria WHERE id_categoria = ?',
            [id]
        );
        return rows.length ? rows[0] : null;
    }

    static async findByTipo(tipo) {
        const [rows] = await db.query(
            'SELECT * FROM categoria WHERE tipo = ? ORDER BY nombre',
            [tipo]
        );
        return rows;
    }

    static async update(id, { nombre, tipo }) {
        const fields = [];
        const values = [];

        if (nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(nombre.trim());
        }
        if (tipo !== undefined) {
            const tiposValidos = ['gastronomica', 'artesanal'];
            if (!tiposValidos.includes(tipo)) throw new Error('Tipo inválido');
            fields.push('tipo = ?');
            values.push(tipo);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        await db.query(
            `UPDATE categoria SET ${fields.join(', ')} WHERE id_categoria = ?`,
            values
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM categoria WHERE id_categoria = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async hasProductos(id_categoria) {
        const [rows] = await db.query(
            'SELECT 1 FROM producto WHERE id_categoria = ? LIMIT 1',
            [id_categoria]
        );
        return rows.length > 0;
    }
}

module.exports = Categoria;
