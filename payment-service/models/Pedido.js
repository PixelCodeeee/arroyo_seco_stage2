const db = require('../config/db');

class Pedido {
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM pedido WHERE id_pedido = ?', [id]);
        return rows[0] || null;
    }

    static async updateEstado(id, estado) {
        await db.query('UPDATE pedido SET estado = ? WHERE id_pedido = ?', [estado, id]);
        return this.findById(id);
    }

    static async create(data) {
        const { id_usuario, monto_total, estado, items, metodo_pago = 'paypal' } = data;
        const connection = await db.getConnection(); // Use transaction

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                'INSERT INTO pedido (id_usuario, monto_total, estado, metodo_pago) VALUES (?, ?, ?, ?)',
                [id_usuario, monto_total, estado, metodo_pago]
            );

            const id_pedido = result.insertId;

            for (const item of items) {
                await connection.query(
                    'INSERT INTO item_pedido (id_pedido, id_producto, cantidad, precio_compra) VALUES (?, ?, ?, ?)',
                    [id_pedido, item.id_producto, item.cantidad, item.precio_compra]
                );
            }

            await connection.commit();

            // Return created order
            const [rows] = await db.query('SELECT * FROM pedido WHERE id_pedido = ?', [id_pedido]);
            return rows[0];

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Pedido;
