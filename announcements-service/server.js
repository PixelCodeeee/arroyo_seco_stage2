const express = require('express');
const cors = require('cors');
require('dotenv').config();

const prisma = require('./config/db');
const { verifyAdmin } = require('./middleware/auth');
const { reservationLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const redis = require('./utils/redis');

const app = express();
const allowedOrigins = process.env.NODE_ENV === 'production' ? ['https://arroyoseco.online'] : ['https://arroyoseco.online', 'http://localhost:5173'];
const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', reservationLimiter); // Protect everything against spam

const PORT = process.env.PORT || 5006;

app.get('/api/announcements/maintenance', async (req, res, next) => {
    try {
        const group = req.headers['x-frontend-version'] || 'stable';
        const message = await redis.get(`maintenance:announcement:${group}`);

        if (message) {
            res.json({ show_banner: true, message });
        } else {
            res.json({ show_banner: false, message: null });
        }
    } catch (error) {
        next(error);
    }
});

app.get('/api/announcements', async (req, res, next) => {
    try {
        const rows = await prisma.announcement.findMany({
            where: { is_active: true },
            orderBy: { event_date: 'asc' }
        });
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

app.get('/api/announcements/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const row = await prisma.announcement.findUnique({
            where: { id }
        });
        if (!row) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.json(row);
    } catch (error) {
        next(error);
    }
});

app.post('/api/announcements', verifyAdmin, async (req, res, next) => {
    try {
        const { title, description, image_url, event_date } = req.body;

        let validDate = null;
        if (event_date) {
            validDate = new Date(`${event_date}T00:00:00Z`);
            if (isNaN(validDate.getTime())) return res.status(400).json({ error: "Fecha inválida" });
        }

        const result = await prisma.announcement.create({
            data: {
                title,
                description,
                image_url,
                event_date: validDate
            }
        });
        res.status(201).json({ message: 'Announcement created', id: result.id });
    } catch (error) {
        next(error);
    }
});

app.put('/api/announcements/:id', verifyAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const { title, description, image_url, event_date, is_active } = req.body;

        let validDate = null;
        if (event_date) {
            validDate = new Date(`${event_date}T00:00:00Z`);
            if (isNaN(validDate.getTime())) return res.status(400).json({ error: "Fecha inválida" });
        }

        await prisma.announcement.update({
            where: { id },
            data: {
                title,
                description,
                image_url,
                event_date: validDate,
                is_active: is_active !== undefined ? is_active : true
            }
        });
        res.json({ message: 'Announcement updated' });
    } catch (error) {
        next(error);
    }
});

app.delete('/api/announcements/:id', verifyAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        await prisma.announcement.delete({
            where: { id }
        });
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Announcements Service running on port ${PORT}`);
});