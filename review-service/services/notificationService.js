// review-service/services/notificationService.js
class NotificationService {
    
    async notificarNuevaReview(oferenteId, review, usuarioNombre) {
        try {
            console.log(`[NOTIFICACIÓN] Nueva review para oferente ${oferenteId}`);
            console.log(`De: ${usuarioNombre}, Rating: ${review.rating}, Título: ${review.titulo}`);
            
            return true;
        } catch (error) {
            console.error('Error enviando notificación:', error);
            return false;
        }
    }

    async notificarRespuestaReview(usuarioId, respuesta, oferenteNombre) {
        try {
            console.log(`[NOTIFICACIÓN] Nueva respuesta para usuario ${usuarioId}`);
            console.log(`De: ${oferenteNombre}, Respuesta: ${respuesta.mensaje.substring(0, 50)}...`);
            
            return true;
        } catch (error) {
            console.error('Error enviando notificación:', error);
            return false;
        }
    }

    async notificarReportReviewada(adminId, reporte) {
        try {
            console.log(`[NOTIFICACIÓN] Review reportada para admin ${adminId || 'todos los admins'}`);
            console.log(`Motivo: ${reporte.motivo}`);
            
            return true;
        } catch (error) {
            console.error('Error enviando notificación:', error);
            return false;
        }
    }
}

module.exports = new NotificationService();