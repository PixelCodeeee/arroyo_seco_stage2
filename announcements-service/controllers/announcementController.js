const { prisma } = require('../config/db');

const getPublicAnnouncement = async (req, res) => {
    try {
        const data = await prisma.announcement.findMany({
            where: { is_active: true },
            orderBy: { event_date: 'asc' }
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAll = async (req, res) => {
    try {
        const data = await prisma.announcement.findMany({
            orderBy: { event_date: 'asc' }
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = await prisma.announcement.findUnique({ where: { id } });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const create = async (req, res) => {
    try {
        const { title, description, image_url, event_date } = req.body;

        const data = await prisma.announcement.create({
            data: {
                title,
                description,
                image_url,
                event_date: event_date ? new Date(event_date) : null
            }
        });

        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, description, image_url, event_date, is_active } = req.body;

        const data = await prisma.announcement.update({
            where: { id },
            data: {
                title,
                description,
                image_url,
                event_date: event_date ? new Date(event_date) : null,
                is_active
            }
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const remove = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        await prisma.announcement.delete({
            where: { id }
        });

        res.json({ message: 'Eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getPublicAnnouncement,
    getAll,
    getById,
    create,
    update,
    remove
};