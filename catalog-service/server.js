require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { promisePool: db } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' ? ['https://arroyoseco.online'] : ['https://arroyoseco.online', 'http://localhost:5173'];
const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { reservationLimiter } = require('./middleware/rateLimiter');
app.use('/api', reservationLimiter);

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[Catalog] ${req.method} ${req.path}`);
    console.log('[Catalog] Headers:', req.headers);
    console.log('[Catalog] Body:', req.body);
    next();
});

// Routes
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/oferentes', require('./routes/oferentes'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/productos', require('./routes/productos'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'catalog-service' });
});

// Database Initialization
async function initDB() {
    try {
        console.log('✓ Catalog Service relies on Prisma schema for mappings');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
    }
}

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server
if (require.main === module) {
    app.listen(PORT, async () => {
        await initDB();
        console.log(`Catalog Service running on port ${PORT}`);
    });
}

module.exports = app;
