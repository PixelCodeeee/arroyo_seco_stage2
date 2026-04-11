const { prisma } = require('../config/db');

class Usuario {
    static async findById(id) {
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: parseInt(id, 10) },
            select: { id_usuario: true, correo: true, nombre: true, rol: true, fecha_creacion: true, esta_activo: true }
        });
        return usuario || null;
    }
}

module.exports = Usuario;
