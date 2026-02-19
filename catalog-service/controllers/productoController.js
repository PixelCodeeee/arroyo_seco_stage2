const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Oferente = require('../models/Oferente');

exports.obtenerProductosPorOferente = async (req, res) => {
    try {
        const { oferenteId } = req.params;

        // Validar que el oferente existe
        const oferente = await Oferente.findById(oferenteId);
        if (!oferente) {
            return res.status(404).json({ error: 'Oferente no encontrado' });
        }

        // Obtener productos del oferente (solo activos/con estatus 1)
        const productos = await Producto.findByOferente(oferenteId);

        res.json({
            success: true,
            productos: productos.filter(p => p.estatus === 1) // Solo productos activos
        });

    } catch (err) {
        console.error('Error obteniendo productos por oferente:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.crearProducto = async (req, res) => {
    try {
        const { id_oferente, nombre, descripcion, precio, inventario, imagenes, estatus = 1, id_categoria } = req.body;

        // Validación básica
        if (!id_oferente || !nombre || !precio || !id_categoria) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Validar oferente existe
        const oferente = await Oferente.findById(id_oferente);
        if (!oferente) {
            return res.status(404).json({ error: 'Oferente no encontrado' });
        }

        // Validar categoría
        const categoria = await Categoria.findById(id_categoria);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Asegurar formato válido para imágenes
        let imgs = [];
        if (Array.isArray(imagenes)) imgs = imagenes;
        else if (typeof imagenes === "string") {
            try { imgs = JSON.parse(imagenes); } catch { }
        }

        const nuevo = await Producto.create({
            id_oferente,
            nombre,
            descripcion,
            precio,
            inventario,
            imagenes: imgs,
            estatus,
            id_categoria
        });

        res.status(201).json({ message: 'Producto creado', producto: nuevo });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Error al crear producto' });
    }
};

exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll();
        const categorias = await Categoria.findAll();
        res.json({ productos, categorias });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerMisProductos = async (req, res) => {
    try {
        const id_oferente = req.user.oferenteId; // auth middleware
        const productos = await Producto.findByOferente(id_oferente);
        res.json({ productos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerProducto = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.actualizarProducto = async (req, res) => {
    try {
        let data = { ...req.body };

        // normalizar imágenes si las mandan como string
        if (data.imagenes !== undefined) {
            if (typeof data.imagenes === "string") {
                try { data.imagenes = JSON.parse(data.imagenes); } catch {
                    data.imagenes = [];
                }
            }
            if (!Array.isArray(data.imagenes)) data.imagenes = [];
        }

        const updated = await Producto.update(req.params.id, data);
        if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json({ message: 'Actualizado', producto: updated });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.eliminarProducto = async (req, res) => {
    try {
        const deleted = await Producto.delete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'No encontrado' });

        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
