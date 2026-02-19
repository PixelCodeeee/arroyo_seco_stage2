const Categoria = require('../models/Categoria');

exports.crearCategoria = async (req, res) => {
    try {
        const { nombre, tipo } = req.body;

        if (!nombre || !tipo) {
            return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
        }

        const categorias = await Categoria.findAll();
        const existe = categorias.find(
            c => c.nombre.toLowerCase() === nombre.trim().toLowerCase() && c.tipo === tipo
        );

        if (existe) {
            return res.status(409).json({ error: 'Esta categoría ya existe en este tipo' });
        }

        const nueva = await Categoria.create({ nombre: nombre.trim(), tipo });
        res.status(201).json({ message: 'Categoría creada', categoria: nueva });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerCategorias = async (req, res) => {
    try {
        const { tipo } = req.query;

        const categorias = tipo
            ? await Categoria.findByTipo(tipo)
            : await Categoria.findAll();

        res.json({ categorias });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.actualizarCategoria = async (req, res) => {
    try {
        const { nombre, tipo } = req.body;

        const updated = await Categoria.update(req.params.id, { nombre, tipo });

        if (!updated) return res.status(404).json({ error: 'Categoría no encontrada' });

        res.json({ message: 'Categoría actualizada', categoria: updated });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.eliminarCategoria = async (req, res) => {
    try {
        const id = req.params.id;

        // Verificar si tiene productos asociados
        const tieneProductos = await Categoria.hasProductos(id);

        if (tieneProductos) {
            return res.status(400).json({
                error: 'No se puede eliminar: hay productos con esta categoría'
            });
        }

        const deleted = await Categoria.delete(id);

        if (!deleted) return res.status(404).json({ error: 'Categoría no encontrada' });

        res.json({ message: 'Categoría eliminada' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
