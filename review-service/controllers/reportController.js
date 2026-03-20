// controllers/reportController.js
const ReportReview = require('../models/ReportReview');
const Review = require('../models/Review');
const promisePool = require('../config/db');
const notificationService = require('../services/notificationService');

// NOTA: BusinessReport no existe en tu BD, solo manejamos reportes de reviews

const reportController = {
    // Reportar una reseña
    async reportReview(req, res) {
        try {
            const userId = req.usuario.id;
            const { id_review } = req.params;
            const { motivo } = req.body; // Solo motivo, sin comentario (tu tabla no tiene campo comentario)

            console.log('Reportando review:', { userId, id_review, motivo });

            // Validar motivo - usando los valores de tu ENUM
            const motivosValidos = ['ofensivo', 'spam', 'falso', 'otro'];
            if (!motivo || !motivosValidos.includes(motivo)) {
                return res.status(400).json({ 
                    error: 'Motivo no válido. Motivos permitidos: ' + motivosValidos.join(', ')
                });
            }

            // Verificar que la review existe
            const review = await Review.findById(id_review);
            if (!review) {
                return res.status(404).json({ error: 'Review no encontrada' });
            }

            // No permitir reportar tu propia review
            if (review.id_usuario === userId) {
                return res.status(400).json({ error: 'No puedes reportar tu propia review' });
            }

            // Verificar si ya reportó
            const yaReporto = await ReportReview.hasUserReported(id_review, userId);
            if (yaReporto) {
                return res.status(400).json({ error: 'Ya has reportado esta review' });
            }

            // Crear reporte - SIN comentario
            const reporte = await ReportReview.create({
                id_review,
                id_usuario_reporta: userId,
                motivo
            });

            // Notificar a admins
            try {
                // notificarReportReviewada es el método que SÍ existe
                await notificationService.notificarReportReviewada(null, reporte);
            } catch (notifError) {
                console.warn('⚠️ Error en notificación (no crítico):', notifError.message);
            }

            res.status(201).json({
                message: 'Reporte enviado exitosamente',
                reporte
            });
        } catch (error) {
            console.error('Error reportando review:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // NOTA: El método reportBusiness ha sido ELIMINADO porque no tienes tabla business_report
    // Si en el futuro agregas esa tabla, puedes descomentarlo

    // Ver mis reportes (como usuario)
    async getMyReports(req, res) {
        try {
            const userId = req.usuario.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // Solo reportes de reviews (business_reports no existe)
            const [reviewReports] = await promisePool.execute(
                `SELECT rr.*, 
                        r.comentario as review_comentario, 
                        r.rating,
                        r.id_oferente
                 FROM review_report rr
                 JOIN review r ON rr.id_review = r.id_review
                 WHERE rr.id_usuario_reporta = ?
                 ORDER BY rr.fecha_creacion DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // Contar total para paginación
            const [[{ total }]] = await promisePool.execute(
                `SELECT COUNT(*) as total 
                 FROM review_report 
                 WHERE id_usuario_reporta = ?`,
                [userId]
            );

            res.json({
                data: reviewReports,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error obteniendo mis reportes:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Ver detalles de un reporte (admin)
    async getReportDetails(req, res) {
        try {
            const { id_reporte } = req.params; // Solo reviews, no hay tipo

            const reporte = await ReportReview.findById(id_reporte);

            if (!reporte) {
                return res.status(404).json({ error: 'Reporte no encontrado' });
            }

            res.json(reporte);
        } catch (error) {
            console.error('Error obteniendo detalles del reporte:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Resolver reporte (admin)
    async resolveReport(req, res) {
        try {
            const { id_reporte } = req.params;
            const { estado } = req.body; // Solo estado, sin comentario ni acción

            console.log('Resolviendo reporte:', { id_reporte, estado });

            // Validar estado - usando los valores de tu ENUM
            if (!['resuelto'].includes(estado)) {
                return res.status(400).json({ 
                    error: 'Estado debe ser resuelto',
                    estadosPermitidos: ['resuelto']
                });
            }

            // Resolver el reporte (marcar como resuelto)
            const reporte = await ReportReview.resolve(id_reporte);

            res.json({
                message: `Reporte resuelto`,
                reporte
            });
        } catch (error) {
            console.error('Error resolviendo reporte:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // OPCIONAL: Ocultar review desde un reporte (acción separada)
    async hideReviewedReview(req, res) {
        try {
            const { id_review } = req.params;
            
            await Review.updateStatus(id_review, 'oculta');
            
            res.json({ message: 'Review ocultada exitosamente' });
        } catch (error) {
            console.error('Error ocultando review:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener reportes pendientes (admin)
    async getPendingReports(req, res) {  // ✅ Corregido: definición correcta de método
        try {
            const { page = 1, limit = 20 } = req.query;
            
            const [reports] = await promisePool.execute(
                `SELECT 
                    rr.id_review_report,
                    rr.motivo,
                    rr.fecha_creacion,
                    rr.estado_reporte,
                    r.id_review,
                    r.rating,
                    r.comentario AS review_comentario,
                    u_autor.nombre AS autor_nombre,
                    o.nombre_negocio,
                    u_reportero.nombre AS reportero_nombre,
                    u_reportero.rol AS reportero_rol
                FROM review_report rr
                INNER JOIN review r ON rr.id_review = r.id_review
                INNER JOIN usuario u_autor ON r.id_usuario = u_autor.id_usuario
                LEFT JOIN oferente o ON r.id_oferente = o.id_oferente
                INNER JOIN usuario u_reportero ON rr.id_usuario_reporta = u_reportero.id_usuario
                WHERE rr.estado_reporte = 'pendiente'
                ORDER BY rr.fecha_creacion ASC
                LIMIT ? OFFSET ?`,
                [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
            );
            
            const [[{ total }]] = await promisePool.execute(
                'SELECT COUNT(*) as total FROM review_report WHERE estado_reporte = "pendiente"'
            );
            
            res.json({
                data: reports,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting pending reports:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = reportController;