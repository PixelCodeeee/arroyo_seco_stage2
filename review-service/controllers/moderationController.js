// controllers/moderationController.js
const Review = require('../models/Review');
const ReportReview = require('../models/ReportReview');

const moderationController = {
    async reportReview(req, res) {
        try {
            const userId = req.usuario.id;
            const { id_review } = req.params;
            const { motivo } = req.body;  // Solo motivo, sin comentario adicional

            // Verificar que la review existe
            const review = await Review.findById(id_review);
            if (!review) {
                return res.status(404).json({ error: 'Review no encontrada' });
            }

            // Verificar si ya reportó
            const yaReporto = await ReportReview.hasUserReported(id_review, userId);
            if (yaReporto) {
                return res.status(400).json({ error: 'Ya has reportado esta review' });
            }

            const reporte = await ReportReview.create({
                id_review,
                id_usuario_reporta: userId,
                motivo
            });

            res.status(201).json(reporte);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getPendingReports(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const reports = await ReportReview.getPending(page, limit);
            res.json(reports);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async moderateReview(req, res) {
        try {
            const { id_review } = req.params;
            const { accion } = req.body; // 'hide', 'unhide', 'delete'

            const estados = {
                'hide': 'oculta',
                'unhide': 'publicada',
                'delete': 'eliminada'
            };

            if (!estados[accion]) {
                return res.status(400).json({ error: 'Acción no válida' });
            }

            await Review.updateStatus(id_review, estados[accion]);
            res.json({ message: `Review ${accion} exitosamente` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async resolveReport(req, res) {
        try {
            const { id_reporte } = req.params;

            const reporte = await ReportReview.resolve(id_reporte);
            res.json(reporte);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = moderationController;