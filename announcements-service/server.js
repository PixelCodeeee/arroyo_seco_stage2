require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { prisma } = require('./config/db');
const { verifyToken, verifyRole } = require('./middleware/auth');
const { reservationLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

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
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use('/api', reservationLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'announcements-service' });
});

// Routes
app.use('/api/announcements', require('./routes/announcement'));

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Announcements service running on port ${PORT}`);
});