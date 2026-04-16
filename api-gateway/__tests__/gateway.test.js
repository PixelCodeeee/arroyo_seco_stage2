const request = require('supertest');
const app = require('../server');

describe('API Gateway', () => {

  describe('GET /health', () => {
    it('should return 200 with OK status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('API Gateway');
    });
  });

  describe('GET /api/', () => {
    it('should return 200 for GCP health check', async () => {
      const res = await request(app).get('/api/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('GCP Health Check OK');
    });
  });

  describe('GET /', () => {
    it('should return gateway running message', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Arroyo Seco API Gateway Running');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/plain|text\/openmetrics/);
      expect(res.text).toContain('arroyo_gateway_');
    });
  });

});
