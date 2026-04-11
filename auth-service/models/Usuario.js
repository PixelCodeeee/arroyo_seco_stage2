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
        const total_usuarios = await db.usuario.count();
        const turistas = await db.usuario.count({ where: { rol: 'turista' } });
        const oferentes = await db.usuario.count({ where: { rol: 'oferente' } });
        const admins = await db.usuario.count({ where: { rol: 'admin' } });
        const activos = await db.usuario.count({ where: { esta_activo: true } });
        
        return { total_usuarios, turistas, oferentes, admins, activos };
    }

    // Usuarios registrados por mes (últimos 6 meses)
    static async getRegistrosPorMes() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const usuarios = await db.usuario.findMany({
            where: { fecha_creacion: { gte: sixMonthsAgo } },
            select: { fecha_creacion: true },
            orderBy: { fecha_creacion: 'asc' }
        });

        const countsMap = new Map();
        
        for (const u of usuarios) {
            if (!u.fecha_creacion) continue;
            
            const reqDate = new Date(u.fecha_creacion);
            const year = reqDate.getFullYear();
            const monthStr = String(reqDate.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;
            
            if (!countsMap.has(key)) {
                let monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(reqDate);
                // To behave like MySQL '%b %Y' (e.g. 'Oct 2023')
                const label = `${monthLabel} ${year}`;
                countsMap.set(key, { mes: key, mes_label: label, total: 0 });
            }
            
            countsMap.get(key).total++;
        }

        return Array.from(countsMap.values());
    }
}

module.exports = Usuario;
