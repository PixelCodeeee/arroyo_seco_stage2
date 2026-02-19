const db = require('../config/db');

class Carrito {
    // Obtener carrito de un usuario con todos los detalles de productos
    static async findByUsuario(id_usuario) {
        const query = `
      SELECT 
        c.id_carrito,
        c.id_producto,
        c.cantidad,
        c.fecha_agregado,
        p.nombre,
        p.descripcion,
        p.precio,
        p.inventario,
        p.imagenes,
        p.esta_disponible,
        o.nombre_negocio,
        o.id_oferente,
        cat.nombre as categoria_nombre
      FROM CARRITO c
      INNER JOIN producto p ON c.id_producto = p.id_producto
      INNER JOIN oferente o ON p.id_oferente = o.id_oferente
      LEFT JOIN categoria cat ON p.id_categoria = cat.id_categoria
      WHERE c.id_usuario = ?
      ORDER BY c.fecha_agregado DESC
    `;

        // Note: Table name case sensitivity might depend on OS/DB settings. Using 'CARRITO' or 'carrito' should match initialized table.

        const [items] = await db.query(query, [id_usuario]);

        return items.map(item => ({
            ...item,
            imagenes: item.imagenes ? JSON.parse(item.imagenes) : [],
            subtotal: parseFloat(item.precio) * item.cantidad
        }));
    }

    // Agregar producto al carrito
    static async addItem(id_usuario, id_producto, cantidad = 1) {
        // Verificar si el producto ya está en el carrito
        const checkQuery = `
      SELECT id_carrito, cantidad 
      FROM CARRITO 
      WHERE id_usuario = ? AND id_producto = ?
    `;

        const [existing] = await db.query(checkQuery, [id_usuario, id_producto]);

        if (existing.length > 0) {
            // Si ya existe, actualizar cantidad
            const nuevaCantidad = existing[0].cantidad + cantidad;
            const updateQuery = `
        UPDATE CARRITO 
        SET cantidad = ? 
        WHERE id_carrito = ?
      `;

            await db.query(updateQuery, [nuevaCantidad, existing[0].id_carrito]);
            return existing[0].id_carrito;
        } else {
            // Si no existe, crear nuevo item
            const insertQuery = `
        INSERT INTO CARRITO (id_usuario, id_producto, cantidad)
        VALUES (?, ?, ?)
      `;

            const [result] = await db.query(insertQuery, [id_usuario, id_producto, cantidad]);
            return result.insertId;
        }
    }

    // Actualizar cantidad de un item
    static async updateCantidad(id_carrito, cantidad) {
        if (cantidad <= 0) {
            // Si la cantidad es 0 o negativa, eliminar el item
            return await this.removeItem(id_carrito);
        }

        const query = `
      UPDATE CARRITO 
      SET cantidad = ? 
      WHERE id_carrito = ?
    `;

        const [result] = await db.query(query, [cantidad, id_carrito]);
        return result.affectedRows > 0;
    }

    // Eliminar un item del carrito
    static async removeItem(id_carrito) {
        const query = 'DELETE FROM CARRITO WHERE id_carrito = ?';
        const [result] = await db.query(query, [id_carrito]);
        return result.affectedRows > 0;
    }

    // Vaciar todo el carrito de un usuario
    static async clearCarrito(id_usuario) {
        const query = 'DELETE FROM CARRITO WHERE id_usuario = ?';
        const [result] = await db.query(query, [id_usuario]);
        return result.affectedRows;
    }

    // Obtener total del carrito
    static async getTotal(id_usuario) {
        const query = `
      SELECT SUM(p.precio * c.cantidad) as total
      FROM CARRITO c
      INNER JOIN producto p ON c.id_producto = p.id_producto
      WHERE c.id_usuario = ? AND p.esta_disponible = TRUE
    `;

        const [result] = await db.query(query, [id_usuario]);
        return parseFloat(result[0].total || 0);
    }

    // Obtener cantidad de items en el carrito
    static async getItemCount(id_usuario) {
        const query = `
      SELECT SUM(cantidad) as total_items
      FROM CARRITO
      WHERE id_usuario = ?
    `;

        const [result] = await db.query(query, [id_usuario]);
        return parseInt(result[0].total_items || 0);
    }

    // Verificar disponibilidad de todos los productos en el carrito
    static async verificarDisponibilidad(id_usuario) {
        const query = `
      SELECT 
        c.id_carrito,
        c.id_producto,
        c.cantidad,
        p.nombre,
        p.inventario,
        p.esta_disponible
      FROM CARRITO c
      INNER JOIN producto p ON c.id_producto = p.id_producto
      WHERE c.id_usuario = ?
    `;

        const [items] = await db.query(query, [id_usuario]);

        const noDisponibles = items.filter(item =>
            !item.esta_disponible || item.inventario < item.cantidad
        );

        return {
            todosDisponibles: noDisponibles.length === 0,
            itemsNoDisponibles: noDisponibles.map(item => ({
                id_producto: item.id_producto,
                nombre: item.nombre,
                cantidadSolicitada: item.cantidad,
                cantidadDisponible: item.inventario,
                estaDisponible: item.esta_disponible
            }))
        };
    }

    // Obtener carrito agrupado por oferente (útil para crear pedidos separados)
    static async getCarritoAgrupadoPoroferente(id_usuario) {
        const query = `
      SELECT 
        c.id_carrito,
        c.id_producto,
        c.cantidad,
        p.nombre,
        p.precio,
        p.imagenes,
        o.id_oferente,
        o.nombre_negocio,
        o.direccion
      FROM CARRITO c
      INNER JOIN producto p ON c.id_producto = p.id_producto
      INNER JOIN oferente o ON p.id_oferente = o.id_oferente
      WHERE c.id_usuario = ? AND p.esta_disponible = TRUE
      ORDER BY o.id_oferente, c.fecha_agregado DESC
    `;

        const [items] = await db.query(query, [id_usuario]);

        // Agrupar por oferente
        const agrupado = items.reduce((acc, item) => {
            const oferenteId = item.id_oferente;

            if (!acc[oferenteId]) {
                acc[oferenteId] = {
                    id_oferente: oferenteId,
                    nombre_negocio: item.nombre_negocio,
                    direccion: item.direccion,
                    productos: [],
                    total: 0
                };
            }

            const subtotal = parseFloat(item.precio) * item.cantidad;

            acc[oferenteId].productos.push({
                id_carrito: item.id_carrito,
                id_producto: item.id_producto,
                nombre: item.nombre,
                precio: parseFloat(item.precio),
                cantidad: item.cantidad,
                imagenes: item.imagenes ? JSON.parse(item.imagenes) : [],
                subtotal
            });

            acc[oferenteId].total += subtotal;

            return acc;
        }, {});

        return Object.values(agrupado);
    }

    // Verificar si un producto está en el carrito de un usuario
    static async isInCarrito(id_usuario, id_producto) {
        const query = `
      SELECT id_carrito, cantidad 
      FROM CARRITO 
      WHERE id_usuario = ? AND id_producto = ?
    `;

        const [result] = await db.query(query, [id_usuario, id_producto]);
        return result.length > 0 ? result[0] : null;
    }
}

module.exports = Carrito;
