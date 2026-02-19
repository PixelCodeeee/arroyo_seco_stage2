const ServicioRestaurante = require('../models/ServicioRestaurante');
const Oferente = require('../models/Oferente');

// Crear
exports.crearServicio = async (req, res) => {
    try {
        const {
            id_oferente,
            nombre,
            descripcion,
            rango_precio,
            capacidad,
            imagenes,
            estatus = 1
        } = req.body;

        if (!id_oferente || !nombre) {
            return res.status(400).json({ error: "id_oferente y nombre son requeridos" });
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

        res.status(201).json({ message: "Servicio creado exitosamente", servicio });
    } catch (error) {
        console.error("Error creating servicio:", error);
        res.status(500).json({ error: "Error al crear servicio" });
    }
};

// traer los servicios
exports.obtenerServicios = async (req, res) => {
    try {
        const servicios = await ServicioRestaurante.findAll();
        const stats = await ServicioRestaurante.getStats();

        res.json({
            total: servicios.length,
            stats,
            servicios
        });
    } catch (error) {
        console.error('Error fetching servicios:', error);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
};

// servicio por ID
exports.obtenerServicioPorId = async (req, res) => {
    try {
        const servicio = await ServicioRestaurante.findById(req.params.id);

        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        res.json(servicio);
    } catch (error) {
        console.error('Error fetching servicio:', error);
        res.status(500).json({ error: 'Error al obtener servicio' });
    }
};

// traer servicios por oferente ID
exports.obtenerServiciosPorOferente = async (req, res) => {
    try {
        const servicios = await ServicioRestaurante.findByOfferenteId(req.params.oferenteId);

        res.json({
            total: servicios.length,
            servicios
        });
    } catch (error) {
        console.error('Error fetching servicios:', error);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
};

// Actualizar (quitamos id_categoria)
exports.actualizarServicio = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            rango_precio,
            capacidad,
            imagenes,
            estatus
        } = req.body;

        const id = req.params.id;

        const servicio = await ServicioRestaurante.findById(id);
        if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

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

        res.json({ message: "Servicio actualizado exitosamente", servicio: actualizado });
    } catch (error) {
        console.error("Error updating servicio:", error);
        res.status(500).json({ error: "Error al actualizar servicio" });
    }
};

// elinminar servicio
exports.eliminarServicio = async (req, res) => {
    try {
        const deleted = await ServicioRestaurante.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        res.json({
            message: 'Servicio eliminado exitosamente',
            id_servicio: req.params.id
        });
    } catch (error) {
        console.error('Error deleting servicio:', error);
        res.status(500).json({ error: 'Error al eliminar servicio' });
    }
};
