import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    ext: {
        loadimpact: {
            projectID: __ENV.K6_PROJECT_ID || 123456, // Replace with your Grafana Cloud project ID
            name: 'Arroyo Seco Backend Load Test'
        }
    },
    stages: [
        { duration: '30s', target: 20 },  // Ramp-up to 20 users over 30 seconds
        { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
        { duration: '30s', target: 0 },   // Ramp-down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    },
};

// Base URL for API Gateway
const BASE_URL = 'http://localhost:5000';

export default function () {
    // 1. Check Health Endpoint
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
        'health is status 200': (r) => r.status === 200,
        'health returns OK': (r) => r.json('status') === 'OK',
    });

    sleep(1);

    // 2. Fetch Products Catalog Endpoint
    const productsRes = http.get(`${BASE_URL}/api/productos`);
    check(productsRes, {
        'products is status 200': (r) => r.status === 200,
        'products return array': (r) => Array.isArray(r.json()),
    });

    sleep(1);
}
