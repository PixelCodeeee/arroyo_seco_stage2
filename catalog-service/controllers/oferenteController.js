const Oferente = require('../models/Oferente');
const Usuario = require('../models/Usuario');

exports.crearOferente = async (req, res) => {
    try {
        console.log('[Controller] crearOferente called');
        console.log('[Controller] req.body:', req.body);
        const { id_usuario, nombre_negocio, direccion, tipo, horario_disponibilidad, imagen, telefono } = req.body || {};

        if (!id_usuario || !nombre_negocio || !tipo) {
            return res.status(400).json({
                error: 'id_usuario, nombre_negocio y tipo son requeridos'
            });
        }

        const usuario = await Usuario.findById(id_usuario);
        if (!usuario) {
            return res.status(404).json({ error: 'El usuario no existe' });
        }

        if (usuario.rol !== 'oferente') {
            return res.status(400).json({ error: 'El usuario debe ser oferente' });
        }

        const exists = await Oferente.findByUserId(id_usuario);
        if (exists) {
            return res.status(409).json({ error: 'Este usuario ya tiene un oferente' });
        }

        const nuevo = await Oferente.create({
            id_usuario,
            nombre_negocio,
            direccion,
            tipo,
            horario_disponibilidad,
            imagen,
            telefono
        });

        res.status(201).json({
            message: 'Oferente creado exitosamente (pendiente)',
            oferente: nuevo
        });

    } catch (error) {
        console.error('Error creating oferente:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerOferentes = async (req, res) => {
    try {
        const { estado, tipo } = req.query;
        let data;

        if (estado || tipo) {
            data = await Oferente.findAllWithFilters({ estado, tipo });
        } else {
            data = await Oferente.findAll();
        }

        res.json({ total: data.length, oferentes: data });

    } catch (error) {
        console.error('Error fetching oferentes:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerOferentePorId = async (req, res) => {
    try {
        const oferente = await Oferente.findById(req.params.id);

        if (!oferente) {
            return res.status(404).json({ error: 'Oferente no encontrado' });
        }

        res.json(oferente);

    } catch (error) {
        console.error('Error fetching oferente:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerOferentePorUsuario = async (req, res) => {
    try {
        const oferente = await Oferente.findByUserId(req.params.userId);

        if (!oferente) {
            return res.status(404).json({ error: 'No existe oferente para este usuario' });
        }

        res.json(oferente);

    } catch (error) {
        console.error('Error fetching oferente:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarOferente = async (req, res) => {
    try {
        const oferenteId = req.params.id;

        const existente = await Oferente.findById(oferenteId);
        if (!existente) {
            return res.status(404).json({ error: 'Oferente no encontrado' });
        }

        const { nombre_negocio, direccion, tipo, horario_disponibilidad, imagen, telefono } = req.body;

        const updated = await Oferente.update(oferenteId, {
            nombre_negocio,
            direccion,
            tipo,
            horario_disponibilidad,
            imagen,
            telefono
        });

        res.json({
            message: 'Oferente actualizado',
            oferente: updated
        });

    } catch (error) {
        console.error('Error updating oferente:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarEstadoOferente = async (req, res) => {
    try {
        const { estado } = req.body;
        const id = req.params.id;

        const estadosValidos = ['pendiente', 'aprobado', 'suspendido'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: `Estado inválido. Debe ser: ${estadosValidos.join(', ')}`
            });
        }

        const existe = await Oferente.findById(id);
        if (!existe) {
            return res.status(404).json({ error: 'Oferente no encontrado' });
        }

        const actualizado = await Oferente.updateEstado(id, estado);

        res.json({
            message: `Estado actualizado a ${estado}`,
            oferente: actualizado
        });

    } catch (error) {
        console.error('Error updating estado:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.eliminarOferente = async (req, res) => {
    try {
        const success = await Oferente.delete(req.params.id);

        if (!success) {
            return res.status(404).json({ error: 'Oferente no encontrado' });
        }

        res.json({ message: 'Oferente eliminado', id_oferente: req.params.id });

    } catch (error) {
        console.error('Error deleting oferente:', error);
        res.status(500).json({ error: error.message });
    }
};
