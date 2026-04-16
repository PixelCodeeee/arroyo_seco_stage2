require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const promClient = require('prom-client');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' ? ['https://arroyoseco.online'] : ['https://arroyoseco.online', 'http://localhost:5173'];
const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const helmet = require('helmet');
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { reservationLimiter } = require('./middleware/rateLimiter');
app.use('/api/usuarios', reservationLimiter);

// Routes
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/internal', require('./routes/internals'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

// --- PROMETHEUS METRICS ---
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'arroyo_auth_' });

app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});
// --------------------------

// Database Initialization handled via Prisma schemas and migrations.

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
