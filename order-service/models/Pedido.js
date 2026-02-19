const db = require('../config/db');

class Pedido {

    // Función helper para parsear imágenes
    static parseImagenes(imagenes) {
        let imgs = [];
        if (Array.isArray(imagenes)) {
            imgs = imagenes;
        } else if (typeof imagenes === "string") {
            try {
                imgs = JSON.parse(imagenes);
            } catch { }
        }
        return imgs;
    }

    // Crear pedido con sus items
    static async create(data) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const {
                id_usuario,
                monto_total,
                estado = 'pendiente',
                items = [] // Array de items: [{ id_producto, cantidad, precio_compra }]
            } = data;

            // Insertar pedido principal
            const [result] = await connection.query(
                `INSERT INTO pedido (id_usuario, monto_total, estado)
                 VALUES (?, ?, ?)`,
                [id_usuario, monto_total, estado]
            );

            const id_pedido = result.insertId;

            // Insertar items del pedido
            if (items.length > 0) {
                const itemsValues = items.map(item => [
                    id_pedido,
                    item.id_producto,
                    item.cantidad,
                    item.precio_compra
                ]);

                await connection.query(
                    `INSERT INTO item_pedido (id_pedido, id_producto, cantidad, precio_compra)
                     VALUES ?`,
                    [itemsValues]
                );
            }

            await connection.commit();

            return await this.findById(id_pedido);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Obtener todos los pedidos con información del usuario
    static async findAll() {
        const [rows] = await db.query(`
            SELECT 
                p.*,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                COUNT(ip.id_item_pedido) as total_items
            FROM pedido p
            LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
            LEFT JOIN item_pedido ip ON p.id_pedido = ip.id_pedido
            GROUP BY p.id_pedido
            ORDER BY p.id_pedido DESC
        `);
        return rows;
    }

    // Obtener pedido por ID con sus items
    static async findById(id) {
        const [pedidos] = await db.query(
            `SELECT 
                p.*,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                u.telefono as telefono_usuario
            FROM pedido p
            LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
            WHERE p.id_pedido = ?`,
            [id]
        );

        if (!pedidos.length) return null;

        const pedido = pedidos[0];

        // Obtener items del pedido
        const [items] = await db.query(
            `SELECT 
                ip.*,
                prod.nombre as nombre_producto,
                prod.descripcion as descripcion_producto,
                prod.imagenes as imagenes_producto,
                o.nombre_negocio as nombre_oferente
            FROM item_pedido ip
            LEFT JOIN producto prod ON ip.id_producto = prod.id_producto
            LEFT JOIN oferente o ON prod.id_oferente = o.id_oferente
            WHERE ip.id_pedido = ?`,
            [id]
        );

        // Parse imagenes JSON
        pedido.items = items.map(item => ({
            ...item,
            imagenes_producto: this.parseImagenes(item.imagenes_producto)
        }));

        return pedido;
    }

    // Obtener pedidos por usuario
    static async findByUsuarioId(usuarioId) {
        const [pedidos] = await db.query(
            `SELECT 
                p.*,
                COUNT(ip.id_item_pedido) as total_items
            FROM pedido p
            LEFT JOIN item_pedido ip ON p.id_pedido = ip.id_pedido
            WHERE p.id_usuario = ?
            GROUP BY p.id_pedido
            ORDER BY p.id_pedido DESC`,
            [usuarioId]
        );

        // Obtener items para cada pedido
        for (let pedido of pedidos) {
            const [items] = await db.query(
                `SELECT 
                    ip.*,
                    prod.nombre as nombre_producto,
                    prod.imagenes as imagenes_producto
                FROM item_pedido ip
                LEFT JOIN producto prod ON ip.id_producto = prod.id_producto
                WHERE ip.id_pedido = ?`,
                [pedido.id_pedido]
            );

            pedido.items = items.map(item => ({
                ...item,
                imagenes_producto: this.parseImagenes(item.imagenes_producto)
            }));
        }

        return pedidos;
    }

    // Obtener pedidos por oferente (para que vea sus ventas)
    static async findByOferenteId(oferenteId) {
        const [rows] = await db.query(
            `SELECT DISTINCT
                p.id_pedido,
                p.id_usuario,
                p.monto_total,
                p.estado,
                p.fecha_creacion,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                u.telefono as telefono_usuario
            FROM pedido p
            LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
            INNER JOIN item_pedido ip ON p.id_pedido = ip.id_pedido
            INNER JOIN producto prod ON ip.id_producto = prod.id_producto
            WHERE prod.id_oferente = ?
            ORDER BY p.id_pedido DESC`,
            [oferenteId]
        );

        // Obtener items de cada pedido que pertenezcan al oferente
        for (let pedido of rows) {
            const [items] = await db.query(
                `SELECT 
                    ip.*,
                    prod.nombre as nombre_producto,
                    prod.imagenes as imagenes_producto
                FROM item_pedido ip
                LEFT JOIN producto prod ON ip.id_producto = prod.id_producto
                WHERE ip.id_pedido = ? AND prod.id_oferente = ?`,
                [pedido.id_pedido, oferenteId]
            );

            pedido.items = items.map(item => ({
                ...item,
                imagenes_producto: this.parseImagenes(item.imagenes_producto)
            }));
        }

        return rows;
    }

    // Obtener pedidos por estado
    static async findByEstado(estado) {
        const [rows] = await db.query(
            `SELECT 
                p.*,
                u.nombre as nombre_usuario,
                u.correo as email_usuario,
                COUNT(ip.id_item_pedido) as total_items
            FROM pedido p
            LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
            LEFT JOIN item_pedido ip ON p.id_pedido = ip.id_pedido
            WHERE p.estado = ?
            GROUP BY p.id_pedido
            ORDER BY p.id_pedido DESC`,
            [estado]
        );
        return rows;
    }

    // Actualizar estado del pedido
    static async updateEstado(id, estado) {
        const [result] = await db.query(
            `UPDATE pedido SET estado = ? WHERE id_pedido = ?`,
            [estado, id]
        );

        if (result.affectedRows === 0) return null;
        return await this.findById(id);
    }

    // Eliminar pedido (solo si está en estado pendiente)
    static async delete(id) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Verificar que el pedido exista y esté en estado pendiente
            const [pedidos] = await connection.query(
                'SELECT estado FROM pedido WHERE id_pedido = ?',
                [id]
            );

            if (pedidos.length === 0) {
                throw new Error('Pedido no encontrado');
            }

            if (pedidos[0].estado !== 'pendiente') {
                throw new Error('Solo se pueden eliminar pedidos en estado pendiente');
            }

            // Eliminar items del pedido
            await connection.query(
                'DELETE FROM item_pedido WHERE id_pedido = ?',
                [id]
            );

            // Eliminar pedido
            const [result] = await connection.query(
                'DELETE FROM pedido WHERE id_pedido = ?',
                [id]
            );

            await connection.commit();
            return result.affectedRows > 0;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Estadísticas de pedidos
    static async getStats() {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as pagados,
                SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as enviados,
                SUM(monto_total) as ventas_totales,
                AVG(monto_total) as ticket_promedio
            FROM pedido
        `);
        return rows[0];
    }

    // Estadísticas por oferente
    static async getStatsByOferente(oferenteId) {
        const [rows] = await db.query(`
            SELECT 
                COUNT(DISTINCT p.id_pedido) as total_pedidos,
                SUM(ip.cantidad) as total_productos_vendidos,
                SUM(ip.cantidad * ip.precio_compra) as ventas_totales
            FROM pedido p
            INNER JOIN item_pedido ip ON p.id_pedido = ip.id_pedido
            INNER JOIN producto prod ON ip.id_producto = prod.id_producto
            WHERE prod.id_oferente = ? AND p.estado = 'pagado'`,
            [oferenteId]
        );
        return rows[0];
    }
}

module.exports = Pedido;
