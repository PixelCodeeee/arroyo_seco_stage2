// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar rutas
const reviewRoutes = require('./routes/reviews');
const responseRoutes = require('./routes/responses');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware de logging
app.use((req, res, next) => {
    console.log('='.repeat(50));
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('='.repeat(50));
    next();
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'review-service',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ msg: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Server error' });
});

app.listen(PORT, () => {
    console.log(`Review service corriendo en puerto ${PORT}`);
});