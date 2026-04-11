const express = require('express');
const cors = require('cors');
require('dotenv').config();

const prisma = require('./config/db');

const app = express();
const allowedOrigins = process.env.NODE_ENV === 'production' ? ['https://arroyoseco.online'] : ['https://arroyoseco.online', 'http://localhost:5173'];
const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5006;

app.get('/api/announcements', async (req, res) => {
    try {
        const rows = await prisma.announcements.findMany({
            where: { is_active: true },
            orderBy: { event_date: 'asc' }
        });
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/announcements/:id', async (req, res) => {
    try {
        const row = await prisma.announcements.findUnique({
            where: { id: parseInt(req.params.id, 10) }
        });
        if (!row) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.json(row);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/announcements', async (req, res) => {
    try {
        const { title, description, image_url, event_date } = req.body;
        const result = await prisma.announcements.create({
            data: {
                title,
                description,
                image_url,
                event_date: event_date ? new Date(event_date) : null
            }
        });
        res.status(201).json({ message: 'Announcement created', id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/announcements/:id', async (req, res) => {
    try {
        const { title, description, image_url, event_date, is_active } = req.body;
        await prisma.announcements.update({
            where: { id: parseInt(req.params.id, 10) },
            data: {
                title,
                description,
                image_url,
                event_date: event_date ? new Date(event_date) : null,
                is_active: is_active !== undefined ? is_active : true
            }
        });
        res.json({ message: 'Announcement updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/announcements/:id', async (req, res) => {
    try {
        await prisma.announcements.delete({
            where: { id: parseInt(req.params.id, 10) }
        });
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
const prismaErrorHandler = require('./middleware/prismaErrorHandler');
app.use(prismaErrorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Announcements Service running on port ${PORT}`);
});