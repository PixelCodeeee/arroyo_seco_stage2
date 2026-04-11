const Reserva = require('../models/Reserva');
const Usuario = require('../models/Usuario');
const ServicioRestaurante = require('../models/ServicioRestaurante');
const { reservaDTO, reservasDTO } = require('../utils/dto');

// Crear reserva
exports.crearReserva = async (req, res, next) => {
    try {
        let {
            id_usuario,
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado = 'pendiente',
            notas
        } = req.body;

        id_usuario = parseInt(id_usuario, 10);
        id_servicio = parseInt(id_servicio, 10);
        numero_personas = parseInt(numero_personas, 10);

        // Validaciones básicas
        if (!id_usuario || isNaN(id_usuario) || !id_servicio || isNaN(id_servicio) || !fecha || !hora || !numero_personas || isNaN(numero_personas)) {
            return res.status(400).json({
                error: "id_usuario, id_servicio, fecha, hora y numero_personas son requeridos y deben ser válidos"
            });
        }

        // Authorization / IDOR Protection
        if (req.user && req.user.rol !== 'admin' && req.user.id !== id_usuario) {
            return res.status(403).json({ error: "No autorizado para crear reserva para otro usuario" });
        }

        // Validar regex de hora (formato HH:MM)
        if (!/^\d{2}:\d{2}$/.test(hora)) {
            return res.status(400).json({ error: "Formato de hora inválido. Usa HH:MM" });
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
        const fechaReserva = new Date(`${fecha}T00:00:00Z`); // Construct generic to validate
        if (isNaN(fechaReserva.getTime())) {
            return res.status(400).json({ error: "Fecha inválida" });
        }

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

        // Crear reserva
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
            reserva: reservaDTO(reserva)
        });

    } catch (error) {
        if (error.message && error.message.includes('Ya existe una reserva')) {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
};

// Obtener todas las reservas (o las correspondientes al rol)
exports.obtenerReservas = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        let reservas = [];
        let stats = null;

        if (req.user.rol === 'admin') {
            reservas = await Reserva.findAll();
            stats = await Reserva.getStats();
        } else if (req.user.rol === 'turista') {
            reservas = await Reserva.findByUsuarioId(req.user.id);
        } else if (req.user.rol === 'oferente') {
            if (!req.user.oferenteId) {
                // If middleware 'verifyToken' is used instead of 'verifyoferente', oferenteId might be missing.
                // We should fetch it.
                const { prisma } = require('../config/db');
                const oferentes = await prisma.oferente.findMany({ where: { id_usuario: req.user.id } });
                if (oferentes.length > 0) {
                    reservas = await Reserva.findByOferenteId(oferentes[0].id_oferente);
                }
            } else {
                reservas = await Reserva.findByOferenteId(req.user.oferenteId);
            }
        }

        res.json({
            total: reservas.length,
            stats,
            reservas: reservasDTO(reservas)
        });
    } catch (error) {
        next(error);
    }
};

// Obtener reserva por ID
exports.obtenerReservaPorId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const reserva = await Reserva.findById(id);

        if (!reserva) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        if (req.user && req.user.rol !== 'admin') {
            if (req.user.rol === 'turista' && reserva.id_usuario !== req.user.id) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            if (req.user.rol === 'oferente') {
                const servicio = await ServicioRestaurante.findById(reserva.id_servicio);
                if (!servicio || servicio.id_oferente !== req.user.oferenteId) {
                    return res.status(403).json({ error: 'No autorizado para ver reserva de otro oferente' });
                }
            }
        }

        res.json(reservaDTO(reserva));
    } catch (error) {
        next(error);
    }
};

// Obtener reservas por usuario
exports.obtenerReservasPorUsuario = async (req, res, next) => {
    try {
        const usuarioId = parseInt(req.params.usuarioId, 10);
        if (isNaN(usuarioId)) return res.status(400).json({ error: "ID inválido" });

        if (req.user && req.user.rol !== 'admin' && req.user.id !== usuarioId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const reservas = await Reserva.findByUsuarioId(usuarioId);

        res.json({
            total: reservas.length,
            reservas: reservasDTO(reservas)
        });
    } catch (error) {
        next(error);
    }
};

// Obtener reservas por servicio
exports.obtenerReservasPorServicio = async (req, res, next) => {
    try {
        const servicioId = parseInt(req.params.servicioId, 10);
        if (isNaN(servicioId)) return res.status(400).json({ error: "ID inválido" });

        const reservas = await Reserva.findByServicioId(servicioId);

        res.json({
            total: reservas.length,
            reservas: reservasDTO(reservas)
        });
    } catch (error) {
        next(error);
    }
};

// Obtener reservas por oferente
exports.obtenerReservasPorOferente = async (req, res, next) => {
    try {
        const oferenteId = parseInt(req.params.oferenteId, 10);
        if (isNaN(oferenteId)) return res.status(400).json({ error: "ID inválido" });

        if (req.user && req.user.rol === 'oferente' && req.user.oferenteId !== oferenteId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const reservas = await Reserva.findByOferenteId(oferenteId);

        res.json({
            total: reservas.length,
            reservas: reservasDTO(reservas)
        });
    } catch (error) {
        next(error);
    }
};

// Obtener reservas por estado
exports.obtenerReservasPorEstado = async (req, res, next) => {
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
            reservas: reservasDTO(reservas)
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar reserva
exports.actualizarReserva = async (req, res, next) => {
    try {
        const {
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado,
            notas
        } = req.body;

        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        // Verificar que la reserva existe
        const reserva = await Reserva.findById(id);
        if (!reserva) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        // IDOR Validation
        if (req.user && req.user.rol !== 'admin') {
            if (req.user.rol === 'turista' && reserva.id_usuario !== req.user.id) {
                return res.status(403).json({ error: "No autorizado" });
            }
            if (req.user.rol === 'oferente') {
                const servicio = await ServicioRestaurante.findById(reserva.id_servicio);
                if (!servicio || servicio.id_oferente !== req.user.oferenteId) {
                    return res.status(403).json({ error: 'No autorizado' });
                }
            }
        }

        // Si se actualiza el servicio, validar que exista
        if (id_servicio !== undefined) {
            if (isNaN(parseInt(id_servicio, 10))) return res.status(400).json({ error: "id_servicio inválido" });
            const servicio = await ServicioRestaurante.findById(parseInt(id_servicio, 10));
            if (!servicio) {
                return res.status(404).json({ error: "El servicio no existe" });
            }
            if (servicio.estatus === 0) {
                return res.status(400).json({ error: "El servicio no está disponible" });
            }
        }

        // Validar número de personas
        if (numero_personas !== undefined) {
            const parsedN = parseInt(numero_personas, 10);
            if (isNaN(parsedN) || parsedN < 1) {
                return res.status(400).json({ error: "El número de personas debe ser válido y al menos 1" });
            }
        }

        // Validar fecha
        if (fecha !== undefined) {
            const fechaReserva = new Date(`${fecha}T00:00:00Z`);
            if (isNaN(fechaReserva.getTime())) return res.status(400).json({ error: "Fecha inválida" });
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fechaReserva < hoy) {
                return res.status(400).json({ error: "No se pueden hacer reservas en fechas pasadas" });
            }
        }

        if (hora !== undefined && !/^\d{2}:\d{2}$/.test(hora)) {
            return res.status(400).json({ error: "Formato de hora inválido. Usa HH:MM" });
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
            id_servicio: id_servicio !== undefined ? parseInt(id_servicio, 10) : undefined,
            fecha,
            hora,
            numero_personas: numero_personas !== undefined ? parseInt(numero_personas, 10) : undefined,
            estado,
            notas
        });

        if (!actualizada) {
            return res.status(404).json({ error: "No se pudo actualizar la reserva" });
        }

        res.json({
            message: "Reserva actualizada exitosamente",
            reserva: reservaDTO(actualizada)
        });

    } catch (error) {
        if (error.message && error.message.includes('Ya existe una reserva')) {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
};

// Cambiar estado de reserva (endpoint específico)
exports.cambiarEstado = async (req, res, next) => {
    try {
        const { estado } = req.body;
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        if (!estado) {
            return res.status(400).json({ error: "El estado es requerido" });
        }

        const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "Estado inválido. Valores permitidos: pendiente, confirmada, cancelada"
            });
        }

        // Authorization check for changing status. Either Admin or the exact oferente
        const reserva = await Reserva.findById(id);
        if (!reserva) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        if (req.user && req.user.rol === 'oferente') {
            const servicio = await ServicioRestaurante.findById(reserva.id_servicio);
            if (!servicio || servicio.id_oferente !== req.user.oferenteId) {
                return res.status(403).json({ error: "No autorizado para modificar esta reserva" });
            }
        }
        else if (req.user && req.user.rol === 'turista') {
            if (estado !== 'cancelada' || reserva.id_usuario !== req.user.id) {
                return res.status(403).json({ error: "No autorizado" });
            }
        }

        const r = await Reserva.updateEstado(id, estado);

        res.json({
            message: `Reserva ${estado} exitosamente`,
            reserva: reservaDTO(r)
        });

    } catch (error) {
        next(error);
    }
};

// Verificar disponibilidad
exports.verificarDisponibilidad = async (req, res, next) => {
    try {
        const { id_servicio, fecha, hora } = req.query;

        const servicioId = parseInt(id_servicio, 10);
        if (isNaN(servicioId) || !fecha || !hora) {
            return res.status(400).json({
                error: "id_servicio (número validó), fecha y hora son requeridos"
            });
        }

        if (!/^\d{2}:\d{2}$/.test(hora)) {
            return res.status(400).json({ error: "Formato de hora inválido. Usa HH:MM" });
        }

        const disponible = await Reserva.checkDisponibilidad(servicioId, fecha, hora);

        res.json({
            disponible,
            message: disponible
                ? "El horario está disponible"
                : "El horario no está disponible"
        });

    } catch (error) {
        next(error);
    }
};

// Eliminar reserva
exports.eliminarReserva = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        // IDOR checking
        const reserva = await Reserva.findById(id);
        if (!reserva) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        if (req.user && req.user.rol !== 'admin') {
            if (req.user.rol === 'turista' && reserva.id_usuario !== req.user.id) {
                return res.status(403).json({ error: "No autorizado para eliminar" });
            }
            if (req.user.rol === 'oferente') {
                return res.status(403).json({ error: "Los oferentes no pueden eliminar reservas, solo cancelarlas" });
            }
        }

        const deleted = await Reserva.delete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json({
            message: 'Reserva eliminada exitosamente',
            id_reserva: id
        });
    } catch (error) {
        next(error);
    }
};

// Top servicios más reservados (recomendaciones)
exports.getTopServicios = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const servicios = await Reserva.getTopServicios(limit);
        res.json({
            total: servicios.length,
            servicios
        });
    } catch (error) {
        next(error);
    }
};

// Stats para analíticas (solo admin)
exports.getStatsAnaliticas = async (req, res, next) => {
    try {
        const stats = await Reserva.getStatsAnaliticas();
        res.json(stats);
    } catch (error) {
        next(error);
    }
};