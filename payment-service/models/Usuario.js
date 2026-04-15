const { prisma } = require('../config/db');

class Usuario {
    static async findById(id) {
        return await prisma.usuario.findUnique({
            where: { id_usuario: parseInt(id, 10) }
        });
    }
}

module.exports = Usuario;
