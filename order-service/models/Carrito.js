const { prisma } = require('../config/db');

class Carrito {
    static parseImagenes(imagenes) {
        if (!imagenes) return [];
        if (Array.isArray(imagenes)) return imagenes;
        if (typeof imagenes === "string") {
            try { return JSON.parse(imagenes); } catch { return []; }
        }
        return [];
    }

    static mapCarritoItems(items) {
        return items.map(c => ({
            id_carrito: c.id_carrito,
            id_producto: c.id_producto,
            cantidad: c.cantidad,
            fecha_agregado: c.fecha_agregado,
            nombre: c.producto?.nombre,
            descripcion: c.producto?.descripcion,
            precio: typeof c.producto?.precio === 'object' && c.producto?.precio !== null ? Number(c.producto.precio) : c.producto?.precio,
            inventario: c.producto?.inventario,
            imagenes: this.parseImagenes(c.producto?.imagenes),
            estatus: c.producto?.estatus,
            nombre_negocio: c.producto?.oferente?.nombre_negocio,
            id_oferente: c.producto?.oferente?.id_oferente,
            categoria_nombre: c.producto?.categoria?.nombre,
            subtotal: (typeof c.producto?.precio === 'object' && c.producto?.precio !== null ? Number(c.producto.precio) : c.producto?.precio) * c.cantidad
        }));
    }

    static async findByUsuario(id_usuario) {
        const items = await prisma.carrito.findMany({
            where: { id_usuario: parseInt(id_usuario, 10) },
            include: {
                producto: {
                    include: {
                        oferente: { select: { id_oferente: true, nombre_negocio: true } },
                        categoria: { select: { nombre: true } }
                    }
                }
            },
            orderBy: { fecha_agregado: 'desc' }
        });

        return this.mapCarritoItems(items);
    }

    static async addItem(id_usuario, id_producto, cantidad = 1) {
        const existing = await prisma.carrito.findFirst({
            where: {
                id_usuario: parseInt(id_usuario, 10),
                id_producto: parseInt(id_producto, 10)
            }
        });

        if (existing) {
            const result = await prisma.carrito.update({
                where: { id_carrito: existing.id_carrito },
                data: { cantidad: existing.cantidad + cantidad }
            });
            return result.id_carrito;
        } else {
            const result = await prisma.carrito.create({
                data: {
                    id_usuario: parseInt(id_usuario, 10),
                    id_producto: parseInt(id_producto, 10),
                    cantidad: parseInt(cantidad, 10)
                }
            });
            return result.id_carrito;
        }
    }

    static async updateCantidad(id_carrito, cantidad) {
        if (cantidad <= 0) return await this.removeItem(id_carrito);

        try {
            await prisma.carrito.update({
                where: { id_carrito: parseInt(id_carrito, 10) },
                data: { cantidad: parseInt(cantidad, 10) }
            });
            return true;
        } catch {
            return false;
        }
    }

    static async removeItem(id_carrito) {
        try {
            await prisma.carrito.delete({
                where: { id_carrito: parseInt(id_carrito, 10) }
            });
            return true;
        } catch {
            return false;
        }
    }

    static async clearCarrito(id_usuario) {
        const result = await prisma.carrito.deleteMany({
            where: { id_usuario: parseInt(id_usuario, 10) }
        });
        return result.count;
    }

    static async getTotal(id_usuario) {
        const items = await prisma.carrito.findMany({
            where: {
                id_usuario: parseInt(id_usuario, 10),
                producto: { estatus: true }
            },
            include: { producto: { select: { precio: true } } }
        });

        const total = items.reduce((acc, current) => {
            const precio = typeof current.producto?.precio === 'object' && current.producto?.precio !== null ? Number(current.producto.precio) : current.producto?.precio;
            return acc + (precio * current.cantidad);
        }, 0);

        return total || 0;
    }

    static async getItemCount(id_usuario) {
        const group = await prisma.carrito.aggregate({
            where: { id_usuario: parseInt(id_usuario, 10) },
            _sum: { cantidad: true }
        });
        return group._sum.cantidad || 0;
    }

    static async verificarDisponibilidad(id_usuario) {
        const items = await prisma.carrito.findMany({
            where: { id_usuario: parseInt(id_usuario, 10) },
            include: { producto: { select: { nombre: true, inventario: true, estatus: true } } }
        });

        const noDisponibles = items.filter(item =>
            !item.producto.estatus || item.producto.inventario < item.cantidad
        );

        return {
            todosDisponibles: noDisponibles.length === 0,
            itemsNoDisponibles: noDisponibles.map(item => ({
                id_producto: item.id_producto,
                nombre: item.producto.nombre,
                cantidadSolicitada: item.cantidad,
                cantidadDisponible: item.producto.inventario,
                estaDisponible: item.producto.estatus
            }))
        };
    }

    static async getCarritoAgrupadoPoroferente(id_usuario) {
        const items = await prisma.carrito.findMany({
            where: { id_usuario: parseInt(id_usuario, 10), producto: { estatus: true } },
            include: {
                producto: {
                    include: {
                        oferente: { select: { id_oferente: true, nombre_negocio: true, direccion: true } }
                    }
                }
            },
            orderBy: { fecha_agregado: 'desc' }
        });

        const agrupado = items.reduce((acc, item) => {
            const oferente = item.producto.oferente;
            const oferenteId = oferente.id_oferente;

            if (!acc[oferenteId]) {
                acc[oferenteId] = {
                    id_oferente: oferenteId,
                    nombre_negocio: oferente.nombre_negocio,
                    direccion: oferente.direccion,
                    productos: [],
                    total: 0
                };
            }

            const precioNum = typeof item.producto.precio === 'object' && item.producto.precio !== null ? Number(item.producto.precio) : item.producto.precio;
            const subtotal = precioNum * item.cantidad;

            acc[oferenteId].productos.push({
                id_carrito: item.id_carrito,
                id_producto: item.id_producto,
                nombre: item.producto.nombre,
                precio: precioNum,
                cantidad: item.cantidad,
                imagenes: this.parseImagenes(item.producto.imagenes),
                subtotal
            });

            acc[oferenteId].total += subtotal;
            return acc;
        }, {});

        return Object.values(agrupado).sort((a, b) => a.id_oferente - b.id_oferente);
    }

    static async isInCarrito(id_usuario, id_producto) {
        return await prisma.carrito.findFirst({
            where: {
                id_usuario: parseInt(id_usuario, 10),
                id_producto: parseInt(id_producto, 10)
            }
        });
    }
}

module.exports = Carrito;
