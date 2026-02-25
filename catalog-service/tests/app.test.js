const request = require('supertest');
const app = require('../server'); // We use our server.js export
const { calculateValue } = require('../lib/logic');

describe('Suite de Pruebas de Calidad de Software', () => {

    describe('Pruebas Unitarias - Lógica de Inventario', () => {
        // Base Unit Tests (Provided by Professor)
        test('Debe calcular correctamente el valor total (10 * 5 = 50)', () => {
            const result = calculateValue(10, 5);
            expect(result).toBe(50);
        });

        test('Debe retornar 0 si se ingresan valores negativos', () => {
            const result = calculateValue(-10, 5);
            expect(result).toBe(0);
        });

        // Desafío de Extensión: 2 Extra Unit Tests
        test('[Extensión] Debe retornar 0 si el stock es cero', () => {
            const result = calculateValue(15, 0);
            expect(result).toBe(0);
        });

        test('[Extensión] Debe calcular correctamente con valores decimales', () => {
            const result = calculateValue(10.5, 2);
            expect(result).toBe(21);
        });
    });

    describe('Pruebas de Integración - API Endpoints', () => {
        // Base Integration Tests (Adapted to catalog-service specific routes)
        test('GET /health - Debe responder con status 200 y JSON correcto', async () => {
            const response = await request(app).get('/health');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('service', 'catalog-service');
        });

        test('GET /api/productos - Debe validar la estructura inicial de respuesta', async () => {
            // Assuming a clean test environment, we might receive an object containing an empty array or categories 
            const response = await request(app).get('/api/productos');
            expect(response.statusCode).toBe(200);
            // As per our productController setup, we return { productos, categorias }
            expect(response.body).toHaveProperty('productos');
            expect(response.body).toHaveProperty('categorias');
            expect(Array.isArray(response.body.productos)).toBe(true);
        });

        // Desafío de Extensión: 2 Extra Integration Tests
        test('[Extensión] GET /api/productos/:id - Debe retornar 404 para un producto inexistente', async () => {
            const nonexistentId = 99999;
            const response = await request(app).get(`/api/productos/${nonexistentId}`);
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('error', 'Producto no encontrado');
        });

        test('[Extensión] POST /api/productos - Debe retornar 400 por validación de campos requeridos', async () => {
            const payloadIncompleto = {
                nombre: "Producto Incompleto",
                // Faltan campos requeridos como id_oferente, precio, id_categoria
            };

            const response = await request(app)
                .post('/api/productos')
                .send(payloadIncompleto);

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error', 'Faltan campos requeridos');
        });
    });

    afterAll(async () => {
        const { pool } = require('../config/db');
        await new Promise((resolve) => pool.end(resolve));
    });
});
