// review-service/controllers/responseController.js
const ResponseReview = require('../models/ResponseReview');
const Review = require('../models/Review');
const promisePool = require('../config/db');

const responseController = {
    async createResponse(req, res) {
        try {
            const { id_review } = req.params;
            const { mensaje } = req.body;
            const userId = Number(req.usuario.id);

            console.log('='.repeat(50));
            console.log('CREANDO RESPUESTA - DATOS RECIBIDOS:');
            console.log('User ID from token:', userId);
            console.log('Review ID:', id_review);
            console.log('Mensaje:', mensaje);

            if (!mensaje || mensaje.trim().length === 0) {
                return res.status(400).json({ error: 'El mensaje es requerido' });
            }

            // PASO 1: Verificar que la review existe
            const review = await Review.findById(id_review);
            if (!review) {
                return res.status(404).json({ error: 'Review no encontrada' });
            }

            console.log('Review encontrada:', {
                id_review: review.id_review,
                id_oferente: review.id_oferente,
                id_usuario: review.id_usuario
            });

            // PASO 2: Buscar TODOS los oferentes que pertenecen a este usuario
            const [ownerRows] = await promisePool.query(
                'SELECT id_oferente, nombre_negocio FROM oferente WHERE id_usuario = ?',
                [userId]
            );

            console.log('Oferentes del usuario:', ownerRows);

            // PASO 3: Verificar si el usuario es dueño del oferente de esta review
            const esDueno = ownerRows.some(o => o.id_oferente === review.id_oferente);

            if (!esDueno) {
                console.log('ACCESO DENEGADO:');
                console.log('   - Oferentes del usuario:', ownerRows.map(o => o.id_oferente));
                console.log('   - Oferente requerido:', review.id_oferente);
                
                return res.status(403).json({
                    error: 'Esta review no pertenece a tu negocio',
                    debug: {
                        tusOferentes: ownerRows.map(o => ({
                            id: o.id_oferente,
                            nombre: o.nombre_negocio
                        })),
                        oferenteRequerido: review.id_oferente
                    }
                });
            }

            console.log('ACCESO PERMITIDO - El usuario es dueño del oferente');

            // PASO 4: Verificar si ya existe respuesta
            const yaResponde = await ResponseReview.exists(id_review);
            if (yaResponde) {
                return res.status(400).json({ error: 'Esta review ya tiene una respuesta' });
            }

            // PASO 5: Crear respuesta
            const response = await ResponseReview.create({
                id_review,
                id_oferente: review.id_oferente,
                mensaje
            });

            console.log('✅ Respuesta creada exitosamente:', response);

            res.status(201).json({
                message: 'Respuesta creada exitosamente',
                response
            });

        } catch (error) {
            console.error('ERROR EN createResponse:', error);
            res.status(500).json({
                error: 'Error al crear la respuesta',
                details: error.message
            });
        }
    },

    // Actualizar respuesta
    async updateResponse(req, res) {
    try {
        const { id_response } = req.params;
        const { mensaje } = req.body;
        const userId = Number(req.usuario.id);

        console.log('Actualizando respuesta - ID:', id_response);
        console.log('Usuario ID:', userId);
        console.log('Nuevo mensaje:', mensaje);

        const response = await ResponseReview.findById(id_response);
        if (!response) {
            return res.status(404).json({ error: 'Respuesta no encontrada' });
        }

        console.log('Respuesta encontrada:', response);

        // Verificar que el usuario es dueño del oferente
        const [ownerRows] = await promisePool.query(
            'SELECT id_oferente FROM oferente WHERE id_usuario = ?',
            [userId]
        );

        console.log('Oferentes del usuario:', ownerRows);

        const esDueno = ownerRows.some(o => o.id_oferente === response.id_oferente);

        if (!esDueno) {
            return res.status(403).json({ 
                error: 'No tienes permiso para modificar esta respuesta' 
            });
        }

        // CORREGIDO: update ya no necesita id_oferente como parámetro separado
        // porque ya está dentro de la respuesta
        const updated = await ResponseReview.update(
            id_response, 
            response.id_oferente, 
            mensaje
        );

        res.json({
            message: 'Respuesta actualizada',
            response: updated
        });

    } catch (error) {
        console.error('ERROR EN updateResponse:', error);
        res.status(500).json({ 
            error: 'Error al actualizar la respuesta',
            details: error.message 
        });
    }
},

    // Eliminar respuesta
    async deleteResponse(req, res) {
        try {
            const { id_response } = req.params;
            const userId = Number(req.usuario.id);

            const response = await ResponseReview.findById(id_response);
            if (!response) {
                return res.status(404).json({ error: 'Respuesta no encontrada' });
            }

            const [ownerRows] = await promisePool.query(
                'SELECT id_oferente FROM oferente WHERE id_usuario = ?',
                [userId]
            );

            const esDueno = ownerRows.some(o => o.id_oferente === response.id_oferente);

            if (!esDueno) {
                return res.status(403).json({ 
                    error: 'No tienes permiso para eliminar esta respuesta' 
                });
            }

            const deleted = await ResponseReview.delete(
                id_response, 
                response.id_oferente, 
                false
            );

            if (deleted) {
                res.json({ message: 'Respuesta eliminada' });
            } else {
                res.status(500).json({ error: 'Error al eliminar la respuesta' });
            }

        } catch (error) {
            console.error('ERROR EN deleteResponse:', error);
            res.status(500).json({ error: 'Error al eliminar la respuesta' });
        }
    }
};

module.exports = responseController;