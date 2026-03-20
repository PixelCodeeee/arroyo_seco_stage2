// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', verifyToken, requireAdmin, adminController.getDashboard);

// Top oferentes
router.get('/top-oferentes', verifyToken, requireAdmin, adminController.getTopOferentes);

// Usuarios activos
router.get('/usuarios-activos', verifyToken, requireAdmin, adminController.getActiveUsers);

// Reportes pendientes
router.get('/reports/pending', verifyToken, requireAdmin, reportController.getPendingReports);
router.get('/reports/:id_reporte', verifyToken, requireAdmin, reportController.getReportDetails);
router.put('/reports/:id_reporte/resolve', verifyToken, requireAdmin, reportController.resolveReport);

// Ruta para moderar reseñas (ocultar/mostrar)
router.put('/reviews/:id_review/moderate', verifyToken, requireAdmin, reviewController.moderateReview);
// O si prefieres usar la existente:
router.put('/reviews/:id_review/hide', verifyToken, requireAdmin, reportController.hideReviewedReview);

module.exports = router;