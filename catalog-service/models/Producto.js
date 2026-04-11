const { prisma } = require('../config/db');

class Producto {

    static parseImagenes(p) {
        if (!p) return p;
        let imgs = [];
        if (Array.isArray(p.imagenes)) {
            imgs = p.imagenes;
        } else if (typeof p.imagenes === "string") {
            try {
                const parsed = JSON.parse(p.imagenes);
                if (Array.isArray(parsed)) imgs = parsed;
            } catch {
                imgs = [];
            }
        }
        return { ...p, imagenes: imgs };
    }

    static mapCategoriaFields(producto) {
        if (!producto) return producto;
        const { categoria, ...rest } = producto;
        return Producto.parseImagenes({
            ...rest,
            precio: typeof rest.precio === 'object' && rest.precio !== null ? Number(rest.precio) : rest.precio,
            nombre_categoria: categoria?.nombre,
            tipo_categoria: categoria?.tipo
        });
    }

    static async create(data) {
        const { id_oferente, nombre, descripcion, precio, inventario = 0, imagenes = [], estatus = true, id_categoria } = data;

        const producto = await prisma.producto.create({
            data: {
                id_oferente: parseInt(id_oferente, 10),
                nombre,
                descripcion: descripcion || null,
                precio: parseFloat(precio || 0),
                inventario: parseInt(inventario, 10),
                imagenes: imagenes && imagenes.length > 0
                    ? JSON.stringify(imagenes)
                    : null,
                estatus: Boolean(estatus),
                id_categoria: id_categoria ? parseInt(id_categoria, 10) : null
            },
            include: { categoria: { select: { nombre: true, tipo: true } } }
        });

        return this.mapCategoriaFields(producto);
    }

    static async findAll() {
        const productos = await prisma.producto.findMany({
            include: { categoria: { select: { nombre: true, tipo: true } } },
            orderBy: { id_producto: 'desc' }
        });
        return productos.map(p => this.mapCategoriaFields(p));
    }

    static async findById(id) {
        const producto = await prisma.producto.findUnique({
            where: { id_producto: parseInt(id, 10) },
            include: { categoria: { select: { nombre: true, tipo: true } } }
        });
        return producto ? this.mapCategoriaFields(producto) : null;
    }

    static async findByOferente(id_oferente) {
        const productos = await prisma.producto.findMany({
            where: {
                id_oferente: parseInt(id_oferente, 10), // ✅ FIXED
                estatus: true
            },
            include: {
                categoria: {
                    select: { nombre: true, tipo: true }
                }
            }
        });

        return productos.map(p => this.mapCategoriaFields(p));
    }

    static async update(id, data) {
        const updateData = {};
        if (data.nombre !== undefined) updateData.nombre = data.nombre;
        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.precio !== undefined) updateData.precio = parseFloat(data.precio);
        if (data.inventario !== undefined) updateData.inventario = parseInt(data.inventario, 10);
        if (data.estatus !== undefined) updateData.estatus = data.estatus === true || data.estatus === 'true';
        if (data.id_categoria !== undefined) updateData.id_categoria = data.id_categoria ? parseInt(data.id_categoria, 10) : null;

        if (data.imagenes !== undefined) {
            updateData.imagenes = data.imagenes && data.imagenes.length > 0
                ? JSON.stringify(data.imagenes)
                : null;
        }
        if (Object.keys(updateData).length === 0) return await this.findById(id);

        const producto = await prisma.producto.update({
            where: { id_producto: parseInt(id, 10) },
            data: updateData,
            include: { categoria: { select: { nombre: true, tipo: true } } }
        });

        return this.mapCategoriaFields(producto);
    }

    static async delete(id) {
        try {
            await prisma.producto.delete({
                where: { id_producto: parseInt(id, 10) }
            });
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = Producto;
