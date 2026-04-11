const { prisma } = require('../config/db');

class Categoria {
    static async create({ nombre, tipo }) {
        const tiposValidos = ['gastronomica', 'artesanal'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error('Tipo debe ser "gastronomica" o "artesanal"');
        }

        return await prisma.categoria.create({
            data: { nombre: nombre.trim(), tipo }
        });
    }

    static async findAll() {
        return await prisma.categoria.findMany({
            orderBy: [
                { tipo: 'desc' },
                { nombre: 'asc' }
            ]
        });
    }

    static async findById(id) {
        return await prisma.categoria.findUnique({
            where: { id_categoria: parseInt(id, 10) }
        });
    }

    static async findByTipo(tipo) {
        return await prisma.categoria.findMany({
            where: { tipo },
            orderBy: { nombre: 'asc' }
        });
    }

    static async update(id, { nombre, tipo }) {
        const data = {};
        if (nombre !== undefined) data.nombre = nombre.trim();
        if (tipo !== undefined) {
            const tiposValidos = ['gastronomica', 'artesanal'];
            if (!tiposValidos.includes(tipo)) throw new Error('Tipo inválido');
            data.tipo = tipo;
        }

        if (Object.keys(data).length === 0) return this.findById(id);

        return await prisma.categoria.update({
            where: { id_categoria: parseInt(id, 10) },
            data
        });
    }

    static async delete(id) {
        try {
            await prisma.categoria.delete({
                where: { id_categoria: parseInt(id, 10) }
            });
            return true;
        } catch {
            return false;
        }
    }

    static async hasProductos(id_categoria) {
        const prod = await prisma.producto.findFirst({
            where: { id_categoria: parseInt(id_categoria, 10) }
        });
        return !!prod;
    }
}

module.exports = Categoria;
