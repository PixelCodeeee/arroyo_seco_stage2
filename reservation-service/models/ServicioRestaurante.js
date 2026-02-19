const db = require('../config/db');

class ServicioRestaurante {
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM servicio_restaurante WHERE id_servicio = ?', [id]);
        return rows[0] || null;
    }
}

module.exports = ServicioRestaurante;
