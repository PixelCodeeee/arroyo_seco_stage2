// models/User.js
const promisePool = require('../config/db');

class User {
    static async findById(id) {
        const [rows] = await promisePool.execute(
            'SELECT id_usuario, nombre, correo, rol FROM usuario WHERE id_usuario = ?',
            [id]
        );
        return rows[0];
    }

    static async findByEmail(email) {
        const [rows] = await promisePool.execute(
            'SELECT * FROM usuario WHERE correo = ?',
            [email]
        );
        return rows[0];
    }

    static async getOferenteInfo(userId) {
        const [rows] = await promisePool.execute(
            `SELECT o.* FROM oferente o 
             WHERE o.id_usuario = ?`,
            [userId]
        );
        return rows[0];
    }
}

module.exports = User;