const { prisma } = require('../config/db');

class Oferente {
  static async findByUsuarioId(id_usuario) {
    return await prisma.oferente.findFirst({
        where: { id_usuario: parseInt(id_usuario, 10) }
    });
  }

  static async updateMpData(id_oferente, data) {
    return await prisma.oferente.update({
        where: { id_oferente: parseInt(id_oferente, 10) },
        data: {
            mp_user_id: data.mp_user_id,
            mp_access_token: data.mp_access_token,
            mp_refresh_token: data.mp_refresh_token,
            mp_estado: data.mp_estado
        }
    });
  }
}

module.exports = Oferente;