const { prisma } = require('../config/db');

class ServicioRestaurante {
    static async findById(id) {
        return await prisma.servicioRestaurante.findUnique({
            where: { id_servicio: parseInt(id, 10) }
        });
    }
}

module.exports = ServicioRestaurante;
