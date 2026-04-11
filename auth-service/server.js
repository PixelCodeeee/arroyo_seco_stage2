require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' ? ['https://arroyoseco.online'] : ['https://arroyoseco.online', 'http://localhost:5173'];
const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/usuarios', require('./routes/usuarios'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

// Database Initialization handled via Prisma schemas and migrations.

// Error handling middleware
const prismaErrorHandler = require('./middleware/prismaErrorHandler');
app.use(prismaErrorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
