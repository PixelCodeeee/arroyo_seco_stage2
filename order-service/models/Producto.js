const db = require('../config/db');

class Producto {
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM producto WHERE id_producto = ?', [id]);
        return rows[0] || null;
    }

    static async checkStock(id, cantidad) {
        const product = await this.findById(id);
        if (!product) return false;
        return product.inventario >= cantidad;
    }
}

module.exports = Producto;
