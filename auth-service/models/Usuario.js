const db = require('../config/db');
const bcrypt = require('bcrypt');

class Usuario {
    // Create new user
    static async create(userData) {
        const { correo, contrasena, nombre, rol } = userData;

        // Hash password
        const saltRounds = 10;
        const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

        const [result] = await db.query(
            'INSERT INTO usuario (correo, contrasena_hash, nombre, rol) VALUES (?, ?, ?, ?)',
            [correo, contrasena_hash, nombre, rol]
        );

        return {
            id_usuario: result.insertId,
            correo,
            nombre,
            rol,
            esta_activo: true
        };
    }

    // Find all users
    static async findAll() {
        const [usuarios] = await db.query(
            'SELECT id_usuario, correo, nombre, rol, fecha_creacion, esta_activo FROM usuario'
        );
        return usuarios;
    }

    // Find user by ID
    static async findById(id) {
        const [usuarios] = await db.query(
            'SELECT id_usuario, correo, nombre, rol, fecha_creacion, esta_activo FROM usuario WHERE id_usuario = ?',
            [id]
        );
        return usuarios[0] || null;
    }

    // Find user by email
    static async findByEmail(correo) {
        const [usuarios] = await db.query(
            'SELECT * FROM usuario WHERE correo = ?',
            [correo]
        );
        return usuarios[0] || null;
    }

    // Update user
    static async update(id, userData) {
        const { correo, contrasena, nombre, rol, esta_activo } = userData;

        let updateFields = [];
        let values = [];

        if (correo) {
            updateFields.push('correo = ?');
            values.push(correo);
        }
        if (contrasena) {
            const contrasena_hash = await bcrypt.hash(contrasena, 10);
            updateFields.push('contrasena_hash = ?');
            values.push(contrasena_hash);
        }
        if (nombre) {
            updateFields.push('nombre = ?');
            values.push(nombre);
        }
        if (rol) {
            updateFields.push('rol = ?');
            values.push(rol);
        }
        if (typeof esta_activo === 'boolean') {
            updateFields.push('esta_activo = ?');
            values.push(esta_activo);
        }

        if (updateFields.length === 0) {
            return null;
        }

        values.push(id);
        const query = `UPDATE usuario SET ${updateFields.join(', ')} WHERE id_usuario = ?`;

        await db.query(query, values);
        return await this.findById(id);
    }

    // Delete user
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM usuario WHERE id_usuario = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Check if email exists
    static async emailExists(correo, excludeId = null) {
        let query = 'SELECT id_usuario FROM usuario WHERE correo = ?';
        let params = [correo];

        if (excludeId) {
            query += ' AND id_usuario != ?';
            params.push(excludeId);
        }

        const [usuarios] = await db.query(query, params);
        return usuarios.length > 0;
    }

    // Stats para analíticas
static async getStats() {
    const [rows] = await db.query(`
        SELECT
            COUNT(*) as total_usuarios,
            SUM(CASE WHEN rol = 'turista' THEN 1 ELSE 0 END) as turistas,
            SUM(CASE WHEN rol = 'oferente' THEN 1 ELSE 0 END) as oferentes,
            SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) as admins,
            SUM(CASE WHEN esta_activo = 1 THEN 1 ELSE 0 END) as activos
        FROM usuario
    `);
    return rows[0];
}

// Usuarios registrados por mes (últimos 6 meses)
static async getRegistrosPorMes() {
    const [rows] = await db.query(`
        SELECT
            DATE_FORMAT(fecha_creacion, '%Y-%m') as mes,
            DATE_FORMAT(fecha_creacion, '%b %Y') as mes_label,
            COUNT(*) as total
        FROM usuario
        WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m'), DATE_FORMAT(fecha_creacion, '%b %Y')
        ORDER BY mes ASC
    `);
    return rows;
}
}



module.exports = Usuario;
