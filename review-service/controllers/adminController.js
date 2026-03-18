// controllers/adminController.js
const promisePool = require('../config/db');

const adminController = {
    // Dashboard básico
    async getDashboard(req, res) {
        try {
            // Consultas simples
            const [reviews] = await promisePool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status_review = 'publicada' THEN 1 ELSE 0 END) as publicadas,
                    SUM(CASE WHEN status_review = 'oculta' THEN 1 ELSE 0 END) as ocultas
                 FROM review`
            );

            const [reportes] = await promisePool.query(
                `SELECT COUNT(*) as pendientes 
                 FROM review_report 
                 WHERE estado_reporte = 'pendiente'`
            );

            const [activos] = await promisePool.query(
                `SELECT u.nombre, COUNT(r.id_review) as reviews
                 FROM usuario u
                 LEFT JOIN review r ON u.id_usuario = r.id_usuario
                 GROUP BY u.id_usuario
                 ORDER BY reviews DESC
                 LIMIT 5`
            );

            res.json({
                reviews: reviews[0],
                reportes_pendientes: reportes[0].pendientes,
                usuarios_activos: activos
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Top oferentes
    async getTopOferentes(req, res) {
        try {
            const [rows] = await promisePool.query(
                `SELECT o.nombre_negocio, 
                        COUNT(r.id_review) as total_reviews,
                        AVG(r.rating) as promedio
                 FROM oferente o
                 LEFT JOIN review r ON o.id_oferente = r.id_oferente
                 WHERE r.status_review = 'publicada'
                 GROUP BY o.id_oferente
                 HAVING total_reviews > 0
                 ORDER BY promedio DESC
                 LIMIT 10`
            );
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Usuarios activos
    async getActiveUsers(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            
            const [rows] = await promisePool.query(
                `SELECT u.nombre, u.correo, COUNT(r.id_review) as reviews
                 FROM usuario u
                 JOIN review r ON u.id_usuario = r.id_usuario
                 WHERE r.fecha_creacion BETWEEN ? AND ?
                 GROUP BY u.id_usuario
                 ORDER BY reviews DESC
                 LIMIT 20`,
                [fecha_inicio || '2024-01-01', fecha_fin || new Date().toISOString().split('T')[0]]
            );
            
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = adminController;