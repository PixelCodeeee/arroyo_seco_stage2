// models/Oferente.js
const db = require('../config/db');

class Oferente {

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM oferente WHERE id_oferente = ?', [id]
    );
    return rows[0] || null;
  }

  static async findByUsuarioId(id_usuario) {
    const [rows] = await db.query(
      'SELECT * FROM oferente WHERE id_usuario = ?', [id_usuario]
    );
    return rows[0] || null;
  }

  static async updateMpData(id_oferente, { mp_user_id, mp_access_token, mp_refresh_token, mp_estado }) {
    await db.query(
      `UPDATE oferente 
       SET mp_user_id = ?, mp_access_token = ?, mp_refresh_token = ?, mp_estado = ?
       WHERE id_oferente = ?`,
      [mp_user_id, mp_access_token, mp_refresh_token, mp_estado, id_oferente]
    );
    return this.findById(id_oferente);
  }

  static async updateMpEstado(id_oferente, mp_estado) {
    await db.query(
      'UPDATE oferente SET mp_estado = ? WHERE id_oferente = ?',
      [mp_estado, id_oferente]
    );
    return this.findById(id_oferente);
  }

  static async getMpEstado(id_oferente) {
    const [rows] = await db.query(
      'SELECT id_oferente, nombre_negocio, mp_estado, mp_user_id FROM oferente WHERE id_oferente = ?',
      [id_oferente]
    );
    return rows[0] || null;
  }

}

module.exports = Oferente;