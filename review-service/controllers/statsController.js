// review-service/controllers/statsController.js
const statsService = require('../services/statsService');

const statsController = {
    async getOferenteStats(req, res) {
        try {
            const { id_oferente } = req.params;
            const stats = await statsService.getOferenteStats(id_oferente);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getProductoStats(req, res) {
        try {
            const { id_producto } = req.params;
            const stats = await statsService.getProductoStats(id_producto);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getServicioStats(req, res) {
        try {
            const { id_servicio } = req.params;
            const stats = await statsService.getServicioStats(id_servicio);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getRecentReviews(req, res) {
        try {
            const { limit = 10 } = req.query;
            const reviews = await statsService.getRecentReviews(limit);
            res.json(reviews);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = statsController;