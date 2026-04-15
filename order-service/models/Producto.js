const { prisma } = require('../config/db');

class Producto {
    static async findById(id) {
        return await prisma.producto.findUnique({
            where: { id_producto: parseInt(id, 10) }
        });
    }

    static async checkStock(id, cantidad) {
        const product = await this.findById(id);
        if (!product) return false;
        return product.inventario >= cantidad;
    }
}

module.exports = Producto;
