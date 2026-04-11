const { prisma } = require('../config/db');

class Pedido {

  static async findById(id) {
    return await prisma.pedido.findUnique({
      where: { id_pedido: parseInt(id, 10) }
    });
  }

  static async updateEstado(id, estado) {
    return await prisma.pedido.update({
      where: { id_pedido: parseInt(id, 10) },
      data: { estado }
    });
  }

  static async create(data) {
    const {
      id_usuario,
      monto_total,
      estado,
      items,
      metodo_pago = 'mercadopago',
      payment_id = null,
      id_oferente = null
    } = data;

    const pedido = await prisma.pedido.create({
      data: {
        id_usuario: parseInt(id_usuario, 10),
        monto_total: parseFloat(monto_total),
        estado: estado,
        metodo_pago: metodo_pago,
        payment_id: payment_id ? payment_id.toString() : null,
        id_oferente: id_oferente ? parseInt(id_oferente, 10) : null,
        items: {
          create: items.map(item => ({
            id_producto: parseInt(item.id_producto, 10),
            cantidad: parseInt(item.cantidad, 10),
            precio_compra: parseFloat(item.precio_compra)
          }))
        }
      }
    });

    return pedido;
  }

}

module.exports = Pedido;