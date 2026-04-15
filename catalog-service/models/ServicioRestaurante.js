const { prisma } = require('../config/db');

class ServicioRestaurante {
    static async create(data) {
        const { id_oferente, nombre, descripcion, rango_precio, capacidad, imagenes = [], estatus = true } = data;

        return await prisma.servicioRestaurante.create({
            data: {
                id_oferente: parseInt(id_oferente, 10),
                nombre,
                descripcion,
                rango_precio,
                capacidad: capacidad ? parseInt(capacidad, 10) : null,
                estatus: Boolean(estatus),
                imagenes: imagenes && imagenes.length > 0
                    ? JSON.stringify(imagenes)
                    : null
            }
        });
    }

    static async findAll() {
        return await prisma.servicioRestaurante.findMany({
            orderBy: { id_servicio: 'desc' }
        });
    }

    static async findById(id) {
        return await prisma.servicioRestaurante.findUnique({
            where: { id_servicio: parseInt(id, 10) }
        });
    }

    static async findByOfferenteId(oferenteId) {
        return await prisma.servicioRestaurante.findMany({
            where: { id_oferente: parseInt(oferenteId, 10) },
            orderBy: { id_servicio: 'desc' }
        });
    }

    static async update(id, data) {
        const updateData = {};
        if (data.nombre !== undefined) updateData.nombre = data.nombre;
        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.rango_precio !== undefined) updateData.rango_precio = data.rango_precio;
        if (data.capacidad !== undefined) updateData.capacidad = parseInt(data.capacidad, 10);
        if (data.estatus !== undefined) updateData.estatus = data.estatus === true || data.estatus === 'true';
        if (data.imagenes !== undefined) {
            updateData.imagenes = data.imagenes && data.imagenes.length > 0 ? JSON.stringify(data.imagenes) : null;
        }

        if (Object.keys(updateData).length === 0) return await this.findById(id);

        return await prisma.servicioRestaurante.update({
            where: { id_servicio: parseInt(id, 10) },
            data: updateData
        });
    }

    static async delete(id) {
        try {
            await prisma.servicioRestaurante.delete({
                where: { id_servicio: parseInt(id, 10) }
            });
            return true;
        } catch {
            return false;
        }
    }

    static async getStats() {
        const total = await prisma.servicioRestaurante.count();
        const disponibles = await prisma.servicioRestaurante.count({ where: { estatus: true } });
        const no_disponibles = await prisma.servicioRestaurante.count({ where: { estatus: false } });

        return {
            total,
            disponibles,
            no_disponibles
        };
    }
}

module.exports = ServicioRestaurante;
