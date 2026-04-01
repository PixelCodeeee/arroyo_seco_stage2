require('dotenv').config();
const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const promClient = require('prom-client');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'https://arroyoseco.online',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(helmet({ crossOriginResourcePolicy: false }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'API Gateway' });
});

// Catch-all for stubborn GCP Health Checks
app.get('/api/', (req, res) => {
    res.status(200).send('GCP Health Check OK');
});

// Default route
app.get('/', (req, res) => {
    res.send('Arroyo Seco API Gateway Running');
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => process.env.NODE_ENV === 'test'
});
app.use(limiter);

// --- PROMETHEUS SETUP ---
// Enable default metrics collection (CPU, Memory, Event Loop)
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'arroyo_gateway_' });

// Expose the /metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});
// ------------------------



// Logging middleware
app.use((req, res, next) => {
    // We don't want to log every single Prometheus scrape, it gets noisy
    if (req.path !== '/metrics') {
        console.log(`[Gateway] ${req.method} ${req.path}`);
    }
    next();
});


// Service URLs
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const CATALOG_SERVICE = process.env.CATALOG_SERVICE_URL || 'http://localhost:5002';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:5003';
const RESERVATION_SERVICE = process.env.RESERVATION_SERVICE_URL || 'http://localhost:5004';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005';
const ANNOUNCEMENTS_SERVICE = process.env.ANNOUNCEMENTS_SERVICE_URL || 'http://localhost:5006';

// Proxy rules
const commonProxyOptions = {
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: (proxyReqOpts) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
};

app.use('/api/usuarios', proxy(AUTH_SERVICE, commonProxyOptions));
app.use('/api/categorias', proxy(CATALOG_SERVICE, commonProxyOptions));
app.use('/api/productos', proxy(CATALOG_SERVICE, commonProxyOptions));
app.use('/api/oferentes', proxy(CATALOG_SERVICE, commonProxyOptions));
app.use('/api/servicios', proxy(CATALOG_SERVICE, commonProxyOptions));
app.use('/api/pedidos', proxy(ORDER_SERVICE, commonProxyOptions));
app.use('/api/carrito', proxy(ORDER_SERVICE, commonProxyOptions));
app.use('/api/reservas', proxy(RESERVATION_SERVICE, commonProxyOptions));

app.use('/api/paypal', proxy(PAYMENT_SERVICE, {
    ...commonProxyOptions,
    userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
        // Explicitly set CORS headers to ensure they are present and singular
        headers['access-control-allow-origin'] = process.env.FRONTEND_URL || 'https://arroyoseco.online';
        headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        headers['access-control-allow-headers'] = 'Content-Type, Authorization';
        return headers;
    }
}));

app.use('/api/announcements', proxy(ANNOUNCEMENTS_SERVICE, commonProxyOptions));



if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`API Gateway running on port ${PORT}`);
        console.log(`Proxies:
    - Auth: ${AUTH_SERVICE}
    - Catalog: ${CATALOG_SERVICE}
    - Orders: ${ORDER_SERVICE}
    - Reservations: ${RESERVATION_SERVICE}
    - Payments: ${PAYMENT_SERVICE}
    - Announcements: ${ANNOUNCEMENTS_SERVICE}
    `);
    });
}

module.exports = app;