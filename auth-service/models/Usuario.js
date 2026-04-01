const db = require('../config/db'); // This is now PrismaClient
const bcrypt = require('bcrypt');

class Usuario {
    // Create new user
    static async create(userData) {
        const { correo, contrasena, nombre, rol } = userData;

        // Hash password
        const saltRounds = 10;
        const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

        const usuario = await db.usuario.create({
            data: {
                correo,
                contrasena_hash,
                nombre,
                rol: rol || 'turista',
                esta_activo: false
            }
        });

        // The original code returned a specific object omitting the hash:
        return {
            id_usuario: usuario.id_usuario,
            correo: usuario.correo,
            nombre: usuario.nombre,
            rol: usuario.rol,
            esta_activo: usuario.esta_activo
        };
    }

    // Find all users
    static async findAll() {
        return await db.usuario.findMany({
            select: {
                id_usuario: true,
                correo: true,
                nombre: true,
                rol: true,
                fecha_creacion: true,
                esta_activo: true
            }
        });
    }

    // Find user by ID
    static async findById(id) {
        return await db.usuario.findUnique({
            where: { id_usuario: parseInt(id, 10) },
            select: {
                id_usuario: true,
                correo: true,
                nombre: true,
                rol: true,
                fecha_creacion: true,
                esta_activo: true
            }
        });
    }

    // Find user by email
    static async findByEmail(correo) {
        return await db.usuario.findUnique({
            where: { correo }
        });
    }

    // Update user
    static async update(id, userData) {
        const { correo, contrasena, nombre, rol, esta_activo } = userData;

        const data = {};
        if (correo) data.correo = correo;
        if (contrasena) {
            data.contrasena_hash = await bcrypt.hash(contrasena, 10);
        }
        if (nombre) data.nombre = nombre;
        if (rol) data.rol = rol;
        if (typeof esta_activo === 'boolean') data.esta_activo = esta_activo;

        if (Object.keys(data).length === 0) {
            return null;
        }

        await db.usuario.update({
            where: { id_usuario: parseInt(id, 10) },
            data
        });

        return await this.findById(id);
    }

    // Delete user
    static async delete(id) {
        try {
            await db.usuario.delete({
                where: { id_usuario: parseInt(id, 10) }
            });
            return true;
        } catch(e) {
            return false;
        }
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Check if email exists
    static async emailExists(correo, excludeId = null) {
        const where = { correo };
        if (excludeId) {
            where.id_usuario = { not: parseInt(excludeId, 10) };
        }
        const user = await db.usuario.findFirst({ where });
        return !!user;
    }

    // Stats para analíticas
    static async getStats() {
        // Since Prisma aggregates aren't great with custom sums based on conditions easily 
        // without groupBy, raw SQL is still best here. Prisma supports raw SQL safely.
        const rows = await db.$queryRaw`
            SELECT
                SUM(1) as total_usuarios,
                SUM(CASE WHEN rol = 'turista' THEN 1 ELSE 0 END) as turistas,
                SUM(CASE WHEN rol = 'oferente' THEN 1 ELSE 0 END) as oferentes,
                SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN esta_activo = 1 THEN 1 ELSE 0 END) as activos
            FROM usuario
        `;
        
        // ensure numerical conversion 
        return {
           total_usuarios: Number(rows[0].total_usuarios),
           turistas: Number(rows[0].turistas),
           oferentes: Number(rows[0].oferentes),
           admins: Number(rows[0].admins),
           activos: Number(rows[0].activos)
        };
    }

    // Usuarios registrados por mes (últimos 6 meses)
    static async getRegistrosPorMes() {
        const rows = await db.$queryRaw`
            SELECT
                DATE_FORMAT(fecha_creacion, '%Y-%m') as mes,
                DATE_FORMAT(fecha_creacion, '%b %Y') as mes_label,
                COUNT(*) as total
            FROM usuario
            WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m'), DATE_FORMAT(fecha_creacion, '%b %Y')
            ORDER BY mes ASC
        `;
        // Convert BigInts from raw queries if necessary
        return rows.map(r => ({
            mes: r.mes,
            mes_label: r.mes_label,
            total: Number(r.total)
        }));
    }
}

module.exports = Usuario;
