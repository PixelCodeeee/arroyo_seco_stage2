require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5003;

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

// Routes
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/carrito', require('./routes/carrito'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'order-service' });
});

// Database Initialization
async function initDB() {
    try {
        console.log('✓ Order Service relies on Prisma schema for mappings');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
    }
}

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
    await initDB();
    console.log(`Order Service running on port ${PORT}`);
});
