const { prisma } = require('../config/db');

class Pedido {
    static parseImagenes(imagenes) {
        if (!imagenes) return [];
        if (Array.isArray(imagenes)) return imagenes;
        if (typeof imagenes === "string") {
            try { return JSON.parse(imagenes); } catch { return []; }
        }
        return [];
    }

    static mapPedidoFields(p) {
        if (!p) return p;

        const mapped = {
            id_pedido: p.id_pedido,
            id_usuario: p.id_usuario,
            monto_total: typeof p.monto_total === 'object' && p.monto_total !== null ? Number(p.monto_total) : p.monto_total,
            fecha_creacion: p.fecha_creacion,
            estado: p.estado,
            metodo_pago: p.metodo_pago,
            nombre_usuario: p.usuario?.nombre,
            email_usuario: p.usuario?.correo,
            total_items: p.items ? p.items.length : 0,
            items: p.items ? p.items.map(ip => ({
                id_item_pedido: ip.id_item_pedido,
                id_pedido: ip.id_pedido,
                id_producto: ip.id_producto,
                cantidad: ip.cantidad,
                precio_compra: typeof ip.precio_compra === 'object' && ip.precio_compra !== null ? Number(ip.precio_compra) : ip.precio_compra,
                nombre_producto: ip.producto?.nombre,
                descripcion_producto: ip.producto?.descripcion,
                imagenes_producto: this.parseImagenes(ip.producto?.imagenes),
                nombre_oferente: ip.producto?.oferente?.nombre_negocio
            })) : []
        };

        return mapped;
    }

    static getIncludes() {
        return {
            usuario: { select: { nombre: true, correo: true } },
            items: {
                include: {
                    producto: {
                        include: {
                            oferente: { select: { nombre_negocio: true } }
                        }
                    }
                }
            }
        };
    }

    static async create(data) {
        const { id_usuario, monto_total, estado = 'pendiente', items = [] } = data;

        const pedido = await prisma.pedido.create({
            data: {
                id_usuario: parseInt(id_usuario, 10),
                monto_total: parseFloat(monto_total),
                estado: estado,
                items: {
                    create: items.map(item => ({
                        id_producto: parseInt(item.id_producto, 10),
                        cantidad: parseInt(item.cantidad, 10),
                        precio_compra: parseFloat(item.precio_compra)
                    }))
                }
            },
            include: this.getIncludes()
        });

        return this.mapPedidoFields(pedido);
    }

    static async findAll() {
        const pedidos = await prisma.pedido.findMany({
            include: this.getIncludes(),
            orderBy: { id_pedido: 'desc' }
        });
        return pedidos.map(p => this.mapPedidoFields(p));
    }

    static async findById(id) {
        const pedido = await prisma.pedido.findUnique({
            where: { id_pedido: parseInt(id, 10) },
            include: this.getIncludes()
        });
        return pedido ? this.mapPedidoFields(pedido) : null;
    }

    static async findByUsuarioId(usuarioId) {
        const pedidos = await prisma.pedido.findMany({
            where: { id_usuario: parseInt(usuarioId, 10) },
            include: this.getIncludes(),
            orderBy: { id_pedido: 'desc' }
        });
        return pedidos.map(p => this.mapPedidoFields(p));
    }

    static async findByOferenteId(oferenteId) {
        const pedidos = await prisma.pedido.findMany({
            where: {
                items: {
                    some: {
                        producto: {
                            id_oferente: parseInt(oferenteId, 10)
                        }
                    }
                }
            },
            include: this.getIncludes(),
            orderBy: { id_pedido: 'desc' }
        });

        return pedidos.map(p => {
            const mapped = this.mapPedidoFields(p);
            mapped.items = mapped.items.filter(item =>
                p.items.find(pi => pi.id_item_pedido === item.id_item_pedido)?.producto?.id_oferente === parseInt(oferenteId, 10)
            );
            return mapped;
        });
    }

    static async findByEstado(estado) {
        const pedidos = await prisma.pedido.findMany({
            where: { estado },
            include: this.getIncludes(),
            orderBy: { id_pedido: 'desc' }
        });
        return pedidos.map(p => this.mapPedidoFields(p));
    }

    static async updateEstado(id, estado) {
        const pedido = await prisma.pedido.update({
            where: { id_pedido: parseInt(id, 10) },
            data: { estado },
            include: this.getIncludes()
        });
        return this.mapPedidoFields(pedido);
    }

    static async delete(id) {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id_pedido: parseInt(id, 10) },
                select: { estado: true }
            });

            if (!pedido) throw new Error("Pedido no encontrado");
            if (pedido.estado !== "pendiente") throw new Error("Solo se pueden eliminar pedidos en estado pendiente");

            await prisma.pedido.delete({
                where: { id_pedido: parseInt(id, 10) }
            });
            return true;
        } catch {
            return false;
        }
    }

    static async getStats() {
        const total = await prisma.pedido.count();
        const pendientes = await prisma.pedido.count({ where: { estado: 'pendiente' } });
        const pagados = await prisma.pedido.count({ where: { estado: 'pagado' } });
        const enviados = await prisma.pedido.count({ where: { estado: 'enviado' } });

        const aggregate = await prisma.pedido.aggregate({
            _sum: { monto_total: true },
            _avg: { monto_total: true }
        });

        return {
            total,
            pendientes,
            pagados,
            enviados,
            ventas_totales: aggregate._sum.monto_total ? Number(aggregate._sum.monto_total) : 0,
            ticket_promedio: aggregate._avg.monto_total ? Number(aggregate._avg.monto_total) : 0
        };
    }

    static async getStatsByOferente(oferenteId) {
        const items = await prisma.item_pedido.findMany({
            where: {
                producto: { id_oferente: parseInt(oferenteId, 10) },
                pedido: { estado: 'pagado' }
            },
            select: {
                id_pedido: true,
                cantidad: true,
                precio_compra: true
            }
        });

        const uniquePedidos = new Set(items.map(item => item.id_pedido));

        let total_productos_vendidos = 0;
        let ventas_totales = 0;
        for (const item of items) {
            total_productos_vendidos += item.cantidad;
            ventas_totales += item.cantidad * Number(item.precio_compra);
        }

        return {
            total_pedidos: uniquePedidos.size,
            total_productos_vendidos,
            ventas_totales
        };
    }

    static async getTopProductos(limit = 10) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const items = await prisma.item_pedido.findMany({
            where: {
                pedido: {
                    estado: { in: ['pagado', 'enviado', 'completado'] },
                    fecha_creacion: { gte: thirtyDaysAgo }
                }
            },
            include: {
                pedido: { select: { id_usuario: true } },
                producto: { include: { oferente: true } }
            }
        });

        const prodStats = new Map();
        for (const ip of items) {
            if (!ip.producto) continue;

            const pid = ip.id_producto;
            if (!prodStats.has(pid)) {
                prodStats.set(pid, {
                    id_producto: pid,
                    nombre_producto: ip.producto.nombre,
                    descripcion: ip.producto.descripcion,
                    imagenes: this.parseImagenes(ip.producto.imagenes),
                    precio: Number(ip.producto.precio),
                    id_oferente: ip.producto.oferente?.id_oferente || null,
                    nombre_negocio: ip.producto.oferente?.nombre_negocio || null,
                    tipo_oferente: ip.producto.oferente?.tipo || null,
                    total_vendido: 0,
                    usuarios_set: new Set()
                });
            }
            const stat = prodStats.get(pid);
            stat.total_vendido += ip.cantidad;
            stat.usuarios_set.add(ip.pedido.id_usuario);
        }

        return Array.from(prodStats.values())
            .sort((a, b) => b.total_vendido - a.total_vendido)
            .slice(0, parseInt(limit, 10))
            .map(s => {
                const { usuarios_set, ...rest } = s;
                rest.total_compradores = usuarios_set.size;
                return rest;
            });
    }

    static async getStatsAnaliticas() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recientes = await prisma.pedido.findMany({
            where: { fecha_creacion: { gte: thirtyDaysAgo } },
            select: { estado: true, monto_total: true }
        });

        let ingresos_totales = 0;
        let pendientes = 0, pagados = 0, enviados = 0, completados = 0;

        for (const p of recientes) {
            if (p.estado === 'pendiente') pendientes++;
            if (p.estado === 'pagado') pagados++;
            if (p.estado === 'enviado') enviados++;
            if (p.estado === 'completado') completados++;
            if (p.estado === 'pagado' || p.estado === 'completado') ingresos_totales += Number(p.monto_total);
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const pedidosHistoricos = await prisma.pedido.findMany({
            where: { estado: { in: ['pagado', 'completado'] }, fecha_creacion: { gte: sixMonthsAgo } },
            select: { fecha_creacion: true, monto_total: true }
        });

        const countsMap = new Map();
        for (const p of pedidosHistoricos) {
            if (!p.fecha_creacion) continue;

            const reqDate = new Date(p.fecha_creacion);
            const year = reqDate.getFullYear();
            const monthStr = String(reqDate.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;

            if (!countsMap.has(key)) {
                let monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(reqDate);
                const label = `${monthLabel} ${year}`;
                countsMap.set(key, { mes: key, mes_label: label, total_pedidos: 0, ingresos: 0 });
            }

            const mapStat = countsMap.get(key);
            mapStat.total_pedidos++;
            mapStat.ingresos += Number(p.monto_total);
        }

        const ventasPorMes = Array.from(countsMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

        return {
            total_pedidos: recientes.length,
            ingresos_totales,
            pendientes,
            pagados,
            enviados,
            completados,
            ventasPorMes
        };
    }
}

module.exports = Pedido;
