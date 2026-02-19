const Reserva = require('../models/Reserva');
const Usuario = require('../models/Usuario');
const ServicioRestaurante = require('../models/ServicioRestaurante');

// Crear reserva
exports.crearReserva = async (req, res) => {
    try {
        const {
            id_usuario,
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado = 'pendiente',
            notas
        } = req.body;

        // Validaciones básicas
        if (!id_usuario || !id_servicio || !fecha || !hora || !numero_personas) {
            return res.status(400).json({
                error: "id_usuario, id_servicio, fecha, hora y numero_personas son requeridos"
            });
        }

        // Validar que el usuario exista
        const usuario = await Usuario.findById(id_usuario);
        if (!usuario) {
            return res.status(404).json({ error: "El usuario no existe" });
        }

        // Validar que el servicio exista
        const servicio = await ServicioRestaurante.findById(id_servicio);
        if (!servicio) {
            return res.status(404).json({ error: "El servicio no existe" });
        }

        // Validar que el servicio esté disponible
        if (servicio.estatus === 0) {
            return res.status(400).json({ error: "El servicio no está disponible" });
        }

        // Validar número de personas
        if (numero_personas < 1) {
            return res.status(400).json({ error: "El número de personas debe ser al menos 1" });
        }

        // Validar capacidad del servicio
        if (servicio.capacidad && numero_personas > servicio.capacidad) {
            return res.status(400).json({
                error: `El servicio tiene capacidad máxima de ${servicio.capacidad} personas`
            });
        }

        // Validar que la fecha no sea en el pasado
        const fechaReserva = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaReserva < hoy) {
            return res.status(400).json({ error: "No se pueden hacer reservas en fechas pasadas" });
        }

        // Validar estado
        const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];
        if (estado && !estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "Estado inválido. Valores permitidos: pendiente, confirmada, cancelada"
            });
        }

        // Crear reserva (las validaciones de unicidad se hacen en el modelo)
        const reserva = await Reserva.create({
            id_usuario,
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado,
            notas
        });

        res.status(201).json({
            message: "Reserva creada exitosamente",
            reserva
        });

    } catch (error) {
        console.error("Error creating reserva:", error);

        // Manejar errores de validación de unicidad
        if (error.message.includes('Ya existe una reserva')) {
            return res.status(409).json({ error: error.message });
        }

        res.status(500).json({ error: "Error al crear reserva" });
    }
};

// Obtener todas las reservas
exports.obtenerReservas = async (req, res) => {
    try {
        const reservas = await Reserva.findAll();
        const stats = await Reserva.getStats();

        res.json({
            total: reservas.length,
            stats,
            reservas
        });
    } catch (error) {
        console.error('Error fetching reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
};

// Obtener reserva por ID
exports.obtenerReservaPorId = async (req, res) => {
    try {
        const reserva = await Reserva.findById(req.params.id);

        if (!reserva) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json(reserva);
    } catch (error) {
        console.error('Error fetching reserva:', error);
        res.status(500).json({ error: 'Error al obtener reserva' });
    }
};

// Obtener reservas por usuario
exports.obtenerReservasPorUsuario = async (req, res) => {
    try {
        const reservas = await Reserva.findByUsuarioId(req.params.usuarioId);

        res.json({
            total: reservas.length,
            reservas
        });
    } catch (error) {
        console.error('Error fetching reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas del usuario' });
    }
};

// Obtener reservas por servicio
exports.obtenerReservasPorServicio = async (req, res) => {
    try {
        const reservas = await Reserva.findByServicioId(req.params.servicioId);

        res.json({
            total: reservas.length,
            reservas
        });
    } catch (error) {
        console.error('Error fetching reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas del servicio' });
    }
};

// Obtener reservas por oferente
exports.obtenerReservasPorOferente = async (req, res) => {
    try {
        const reservas = await Reserva.findByOferenteId(req.params.oferenteId);

        res.json({
            total: reservas.length,
            reservas
        });
    } catch (error) {
        console.error('Error fetching reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas del oferente' });
    }
};

// Obtener reservas por estado
exports.obtenerReservasPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;

        const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "Estado inválido. Valores permitidos: pendiente, confirmada, cancelada"
            });
        }

        const reservas = await Reserva.findByEstado(estado);

        res.json({
            total: reservas.length,
            estado,
            reservas
        });
    } catch (error) {
        console.error('Error fetching reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas por estado' });
    }
};

// Actualizar reserva
exports.actualizarReserva = async (req, res) => {
    try {
        const {
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado,
            notas
        } = req.body;

        const id = req.params.id;

        // Verificar que la reserva existe
        const reserva = await Reserva.findById(id);
        if (!reserva) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        // Si se actualiza el servicio, validar que exista
        if (id_servicio !== undefined) {
            const servicio = await ServicioRestaurante.findById(id_servicio);
            if (!servicio) {
                return res.status(404).json({ error: "El servicio no existe" });
            }
            if (servicio.estatus === 0) {
                return res.status(400).json({ error: "El servicio no está disponible" });
            }
        }

        // Validar número de personas
        if (numero_personas !== undefined && numero_personas < 1) {
            return res.status(400).json({ error: "El número de personas debe ser al menos 1" });
        }

        // Validar fecha
        if (fecha !== undefined) {
            const fechaReserva = new Date(fecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fechaReserva < hoy) {
                return res.status(400).json({ error: "No se pueden hacer reservas en fechas pasadas" });
            }
        }

        // Validar estado
        if (estado !== undefined) {
            const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    error: "Estado inválido. Valores permitidos: pendiente, confirmada, cancelada"
                });
            }
        }

        const actualizada = await Reserva.update(id, {
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado,
            notas
        });

        if (!actualizada) {
            return res.status(404).json({ error: "No se pudo actualizar la reserva" });
        }

        res.json({
            message: "Reserva actualizada exitosamente",
            reserva: actualizada
        });

    } catch (error) {
        console.error("Error updating reserva:", error);

        // Manejar errores de validación de unicidad
        if (error.message.includes('Ya existe una reserva')) {
            return res.status(409).json({ error: error.message });
        }

        res.status(500).json({ error: "Error al actualizar reserva" });
    }
};

// Cambiar estado de reserva (endpoint específico)
exports.cambiarEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        const id = req.params.id;

        if (!estado) {
            return res.status(400).json({ error: "El estado es requerido" });
        }

        const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "Estado inválido. Valores permitidos: pendiente, confirmada, cancelada"
            });
        }

        const reserva = await Reserva.updateEstado(id, estado);

        if (!reserva) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        res.json({
            message: `Reserva ${estado} exitosamente`,
            reserva
        });

    } catch (error) {
        console.error("Error changing estado:", error);
        res.status(500).json({ error: "Error al cambiar estado de reserva" });
    }
};

// Verificar disponibilidad
exports.verificarDisponibilidad = async (req, res) => {
    try {
        const { id_servicio, fecha, hora } = req.query;

        if (!id_servicio || !fecha || !hora) {
            return res.status(400).json({
                error: "id_servicio, fecha y hora son requeridos"
            });
        }

        const disponible = await Reserva.checkDisponibilidad(id_servicio, fecha, hora);

        res.json({
            disponible,
            message: disponible
                ? "El horario está disponible"
                : "El horario no está disponible"
        });

    } catch (error) {
        console.error("Error checking disponibilidad:", error);
        res.status(500).json({ error: "Error al verificar disponibilidad" });
    }
};

// Eliminar reserva
exports.eliminarReserva = async (req, res) => {
    try {
        const deleted = await Reserva.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json({
            message: 'Reserva eliminada exitosamente',
            id_reserva: req.params.id
        });
    } catch (error) {
        console.error('Error deleting reserva:', error);
        res.status(500).json({ error: 'Error al eliminar reserva' });
    }
};
