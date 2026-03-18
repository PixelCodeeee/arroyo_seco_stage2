const promisePool = require('../config/db');
const db = promisePool;

class Oferente {
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM oferente WHERE id_oferente = ?', [id]);
        return rows[0] || null;
    }
}

module.exports = Oferente;
