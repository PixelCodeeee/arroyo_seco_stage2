require('dotenv').config();
const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'API Gateway' });
});

// Service URLs (could be env vars)
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const CATALOG_SERVICE = process.env.CATALOG_SERVICE_URL || 'http://localhost:5002';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:5003';
const RESERVATION_SERVICE = process.env.RESERVATION_SERVICE_URL || 'http://localhost:5004';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005';

// Proxy rules
app.use('/api/usuarios', proxy(AUTH_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/usuarios${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/categorias', proxy(CATALOG_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/categorias${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/productos', proxy(CATALOG_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/productos${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/oferentes', proxy(CATALOG_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/oferentes${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/servicios', proxy(CATALOG_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/servicios${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/pedidos', proxy(ORDER_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/pedidos${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/carrito', proxy(ORDER_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/carrito${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/reservas', proxy(RESERVATION_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/reservas${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    }
}));

app.use('/api/paypal', proxy(PAYMENT_SERVICE, {
    proxyReqPathResolver: (req) => {
        return `/api/paypal${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        return proxyReqOpts;
    },
    userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
        // Explicitly set CORS headers to ensure they are present and singular
        headers['access-control-allow-origin'] = '*';
        headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        headers['access-control-allow-headers'] = 'Content-Type, Authorization';
        return headers;
    }
}));

// Default route
app.get('/', (req, res) => {
    res.send('Arroyo Seco API Gateway Running');
});

// Start Gateway
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Proxies:
    - Auth: ${AUTH_SERVICE}
    - Catalog: ${CATALOG_SERVICE}
    - Orders: ${ORDER_SERVICE}
    - Reservations: ${RESERVATION_SERVICE}
    - Payments: ${PAYMENT_SERVICE}
    `);
});
