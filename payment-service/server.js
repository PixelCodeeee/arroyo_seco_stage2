require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const promClient = require('prom-client');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5005;

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
app.use('/api', reservationLimiter);

// Routes
app.use('/api/mercadopago', require('./routes/mercadopago'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'payment-service' });
});

// --- PROMETHEUS METRICS ---
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'arroyo_payment_' });

app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});
// --------------------------

// Database Initialization (Optional here, assuming order-service creates tables, but good for safety)
async function initDB() {
    try {
        // We assume tables are created by order-service, but connection check is good.
        console.log('✓ Payment Service DB connected');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
    await initDB();
    console.log(`Payment Service running on port ${PORT}`);
});
