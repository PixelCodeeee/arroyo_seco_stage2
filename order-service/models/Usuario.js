const db = require('../config/db');

class Usuario {
    static async findById(id) {
        const [usuarios] = await db.query(
            'SELECT * FROM usuario WHERE id_usuario = ?',
            [id]
        );
        return usuarios[0] || null;
    }
}

module.exports = Usuario;
