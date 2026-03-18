// routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Rutas para usuarios (requieren token)
router.post('/review/:id_review', verifyToken, reportController.reportReview);
router.get('/mis-reportes', verifyToken, reportController.getMyReports);

// Rutas para admin
router.get('/review/:id_reporte', verifyToken, requireAdmin, reportController.getReportDetails);
router.put('/review/:id_reporte/resolver', verifyToken, requireAdmin, reportController.resolveReport);
router.put('/review/:id_review/hide', verifyToken, requireAdmin, reportController.hideReviewedReview);

module.exports = router;