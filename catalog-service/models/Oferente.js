const { prisma } = require('../config/db');

class Oferente {
    static async create(oferenteData) {
        const { id_usuario, nombre_negocio, direccion, tipo, horario_disponibilidad, imagen, telefono } = oferenteData;

        const tiposValidos = ['restaurante', 'artesanal'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error('Tipo debe ser "restaurante" o "artesanal"');
        }

        const oferente = await prisma.oferente.create({
            data: {
                id_usuario: parseInt(id_usuario, 10),
                nombre_negocio,
                direccion,
                tipo,
                horario_disponibilidad: typeof horario_disponibilidad === 'object' && horario_disponibilidad !== null ? JSON.stringify(horario_disponibilidad) : (horario_disponibilidad || null),
                imagen: imagen || null,
                telefono: telefono || null
            },
            include: { usuario: { select: { nombre: true, correo: true } } }
        });

        return this.mapUsuarioFields(oferente);
    }

    static async findAll() {
        const oferentes = await prisma.oferente.findMany({
            include: { usuario: { select: { nombre: true, correo: true } } },
            orderBy: { id_oferente: 'desc' }
        });

        return oferentes.map(o => this.mapUsuarioFields(o));
    }

    static async findAllWithFilters({ estado, tipo }) {
        const where = {};
        if (estado) where.estado = estado;
        if (tipo) where.tipo = tipo;

        const oferentes = await prisma.oferente.findMany({
            where,
            include: { usuario: { select: { nombre: true, correo: true } } },
            orderBy: { id_oferente: 'desc' }
        });

        return oferentes.map(o => this.mapUsuarioFields(o));
    }

    static async findById(id) {
        const oferente = await prisma.oferente.findUnique({
            where: { id_oferente: parseInt(id, 10) },
            include: { usuario: { select: { nombre: true, correo: true } } }
        });
        return oferente ? this.mapUsuarioFields(oferente) : null;
    }

    static async findByUserId(userId) {
        const oferente = await prisma.oferente.findFirst({
            where: { id_usuario: parseInt(userId, 10) },
            include: { usuario: { select: { nombre: true, correo: true } } }
        });
        return oferente ? this.mapUsuarioFields(oferente) : null;
    }

    static async update(id, data) {
        const { nombre_negocio, direccion, tipo, horario_disponibilidad, imagen, telefono } = data;
        const updateData = {};

        if (nombre_negocio !== undefined) updateData.nombre_negocio = nombre_negocio;
        if (direccion !== undefined) updateData.direccion = direccion;
        if (tipo !== undefined) {
            const tiposValidos = ['restaurante', 'artesanal'];
            if (!tiposValidos.includes(tipo)) throw new Error('Tipo debe ser "restaurante" o "artesanal"');
            updateData.tipo = tipo;
        }
        if (horario_disponibilidad !== undefined) {
            updateData.horario_disponibilidad = typeof horario_disponibilidad === 'object' ? JSON.stringify(horario_disponibilidad) : horario_disponibilidad;
        }
        if (imagen !== undefined) updateData.imagen = imagen;
        if (telefono !== undefined) updateData.telefono = telefono;

        if (Object.keys(updateData).length === 0) return await this.findById(id);

        const oferente = await prisma.oferente.update({
            where: { id_oferente: parseInt(id, 10) },
            data: updateData,
            include: { usuario: { select: { nombre: true, correo: true } } }
        });

        return this.mapUsuarioFields(oferente);
    }

    static async updateEstado(id, estado) {
        const estadosValidos = ['pendiente', 'aprobado', 'suspendido'];
        if (!estadosValidos.includes(estado)) throw new Error('Estado inválido');

        const oferente = await prisma.oferente.update({
            where: { id_oferente: parseInt(id, 10) },
            data: { estado },
            include: { usuario: { select: { nombre: true, correo: true } } }
        });
        return this.mapUsuarioFields(oferente);
    }

    static async updateImagen(id, imagenUrl) {
        const oferente = await prisma.oferente.update({
            where: { id_oferente: parseInt(id, 10) },
            data: { imagen: imagenUrl },
            include: { usuario: { select: { nombre: true, correo: true } } }
        });
        return this.mapUsuarioFields(oferente);
    }

    static async delete(id) {
        try {
            await prisma.oferente.delete({
                where: { id_oferente: parseInt(id, 10) }
            });
            return true;
        } catch {
            return false;
        }
    }

    static mapUsuarioFields(oferente) {
        if (!oferente) return oferente;
        const { usuario, ...rest } = oferente;
        
        let safeHorario = rest.horario_disponibilidad;
        if (typeof safeHorario === 'string') {
            try { safeHorario = JSON.parse(safeHorario); } 
            catch { safeHorario = null; }
        }

        return {
            ...rest,
            horario_disponibilidad: safeHorario,
            nombre_usuario: usuario?.nombre,
            correo_usuario: usuario?.correo
        };
    }
}

module.exports = Oferente;
