const { prisma } = require('../config/db');

class Oferente {
    static async findById(id) {
        return await prisma.oferente.findUnique({
            where: { id_oferente: parseInt(id, 10) }
        });
    }
}

module.exports = Oferente;
