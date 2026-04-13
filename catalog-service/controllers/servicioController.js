const ServicioRestaurante = require('../models/ServicioRestaurante');
const Oferente = require('../models/Oferente');
const { servicioDTO, serviciosDTO } = require('../utils/dto');

// Crear
exports.crearServicio = async (req, res, next) => {
    try {
        let {
            id_oferente,
            nombre,
            descripcion,
            rango_precio,
            capacidad,
            imagenes,
            estatus = true
        } = req.body;

        id_oferente = parseInt(id_oferente, 10);
        if (!id_oferente || isNaN(id_oferente) || !nombre) {
            return res.status(400).json({ error: "id_oferente (número) y nombre son requeridos" });
        }

        // Authorization check. IDOR prevention.
        if (req.user && req.user.rol === 'oferente') {
            const oferenteUser = await Oferente.findByUserId(req.user.id);
            if (!oferenteUser || oferenteUser.id_oferente !== id_oferente) {
                return res.status(403).json({ error: "No autorizado para crear servicios para otros oferentes" });
            }
        } else if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ error: "No autorizado" });
        }

        const oferente = await Oferente.findById(id_oferente);
        if (!oferente) return res.status(404).json({ error: "El oferente no existe" });

        // Solo 1 servicio por oferente
        const existente = await ServicioRestaurante.findByOfferenteId(id_oferente);
        if (existente.length > 0) {
            return res.status(409).json({ error: "Este oferente ya tiene un servicio creado" });
        }

        if (capacidad !== undefined && capacidad < 0) {
            return res.status(400).json({ error: "La capacidad no puede ser negativa" });
        }

        const servicio = await ServicioRestaurante.create({
            id_oferente,
            nombre,
            descripcion,
            rango_precio,
            capacidad,
            imagenes,
            estatus
        });

        res.status(201).json({ message: "Servicio creado exitosamente", servicio: servicioDTO(servicio) });
    } catch (error) {
        next(error);
    }
};

// traer los servicios
exports.obtenerServicios = async (req, res, next) => {
    try {
        const servicios = await ServicioRestaurante.findAll();
        const stats = await ServicioRestaurante.getStats();

        res.json({
            total: servicios.length,
            stats,
            servicios: serviciosDTO(servicios)
        });
    } catch (error) {
        next(error);
    }
};

// servicio por ID
exports.obtenerServicioPorId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const servicio = await ServicioRestaurante.findById(id);

        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        res.json(servicioDTO(servicio));
    } catch (error) {
        next(error);
    }
};

// traer servicios por oferente ID
exports.obtenerServiciosPorOferente = async (req, res, next) => {
    try {
        const oferenteId = parseInt(req.params.oferenteId, 10);
        if (isNaN(oferenteId)) return res.status(400).json({ error: "ID inválido" });

        const servicios = await ServicioRestaurante.findByOfferenteId(oferenteId);

        res.json({
            total: servicios.length,
            servicios: serviciosDTO(servicios)
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar (quitamos id_categoria)
exports.actualizarServicio = async (req, res, next) => {
    try {
        const {
            nombre,
            descripcion,
            rango_precio,
            capacidad,
            imagenes,
            estatus
        } = req.body;

        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const servicio = await ServicioRestaurante.findById(id);
        if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

        // Authorization check. IDOR prevention.
        if (req.user) {
            if (req.user.rol === 'admin') {
                // Admin puede modificar cualquier servicio
            }
            else if (req.user.rol === 'oferente') {
                const oferenteUser = await Oferente.findByUserId(req.user.id);

                if (!oferenteUser) {
                    return res.status(403).json({
                        error: "Debes crear un perfil de oferente"
                    });
                }

                if (oferenteUser.id_oferente !== servicio.id_oferente) {
                    return res.status(403).json({
                        error: "No autorizado para modificar servicios de otros oferentes"
                    });
                }
            }
            else {
                return res.status(403).json({ error: "No autorizado" });
            }
        }

        if (capacidad !== undefined && capacidad < 0) {
            return res.status(400).json({ error: "La capacidad no puede ser negativa" });
        }

        const actualizado = await ServicioRestaurante.update(id, {
            nombre,
            descripcion,
            rango_precio,
            capacidad,
            imagenes,
            estatus
        });

        res.json({ message: "Servicio actualizado exitosamente", servicio: servicioDTO(actualizado) });
    } catch (error) {
        next(error);
    }
};

// elinminar servicio
exports.eliminarServicio = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const servicio = await ServicioRestaurante.findById(id);
        if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

        // Authorization check
        if (req.user && req.user.rol === 'oferente') {
            const oferenteUser = await Oferente.findByUserId(req.user.id);
            if (!oferenteUser || oferenteUser.id_oferente !== servicio.id_oferente) {
                return res.status(403).json({ error: "No autorizado para eliminar servicios de otros oferentes" });
            }
        } else if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ error: "No autorizado" });
        }

        const deleted = await ServicioRestaurante.delete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        res.json({
            message: 'Servicio eliminado exitosamente',
            id_servicio: id
        });
    } catch (error) {
        next(error);
    }
};
