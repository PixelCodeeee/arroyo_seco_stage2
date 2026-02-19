const db = require('../config/db');

class Usuario {
    static async findById(id) {
        const [usuarios] = await db.query(
            'SELECT id_usuario, correo, nombre, rol, fecha_creacion, esta_activo FROM usuario WHERE id_usuario = ?',
            [id]
        );
        return usuarios[0] || null;
    }
}

module.exports = Usuario;
