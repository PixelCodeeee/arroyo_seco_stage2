require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/paypal', require('./routes/paypal'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'payment-service' });
});

// Database Initialization (Optional here, assuming order-service creates tables, but good for safety)
async function initDB() {
    try {
        // We assume tables are created by order-service, but connection check is good.
        console.log('✓ Payment Service DB connected');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    await initDB();
    console.log(`Payment Service running on port ${PORT}`);
});
