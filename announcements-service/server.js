require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5006;

// Middlewares
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://arroyoseco.online']
    : ['https://arroyoseco.online', 'http://localhost:5173'];

const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : allowedOrigins,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Corregido: /api/announcements (con 's')
app.use('/api/announcements', require('./routes/announcement'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Announcement-service' });
});

// Root
app.get('/', (req, res) => {
    res.send('Announcement Service Running');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`Announcements service running on port ${PORT}`);
});