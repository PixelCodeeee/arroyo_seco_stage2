const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Oferente = require('../models/Oferente');
const { productoDTO, productosDTO } = require('../utils/dto');

// En el caso de los catalogos, la base de datos se debe exponer, pero restringir las modificaciones.

exports.obtenerProductosPorOferente = async (req, res, next) => {
    try {
        const oferenteId = parseInt(req.params.oferenteId, 10);
        if (isNaN(oferenteId)) return res.status(400).json({ error: "ID inválido" });

        // Validar que el oferente existe
        const oferente = await Oferente.findById(oferenteId);
        if (!oferente) {
            return res.status(404).json({ error: 'Oferente no encontrado' });
        }

        // Obtener productos del oferente (solo activos/con estatus 1)
        const productos = await Producto.findByOferente(oferenteId);

        res.json({
            success: true,
            productos: productosDTO(productos)
        });

    } catch (err) {
        next(err);
    }
};

exports.crearProducto = async (req, res, next) => {
    try {
        let { id_oferente, nombre, descripcion, precio, inventario, imagenes, estatus = true, id_categoria } = req.body;
        id_oferente = parseInt(id_oferente, 10);
        id_categoria = parseInt(id_categoria, 10);

        // Validación básica
        if (!id_oferente || isNaN(id_oferente) || !nombre || !precio || !id_categoria || isNaN(id_categoria)) {
            return res.status(400).json({ error: 'Faltan campos requeridos y numéricos' });
        }

        // Authorization check. IDOR prevention.
        if (req.user && req.user.rol === 'oferente') {
            const oferenteUser = await Oferente.findByUserId(req.user.id);
            if (!oferenteUser || oferenteUser.id_oferente !== id_oferente) {
                return res.status(403).json({ error: "No autorizado para crear productos de otro oferente" });
            }
        } else if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ error: "No autorizado" });
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

        res.status(201).json({ message: 'Producto creado', producto: productoDTO(nuevo) });

    } catch (err) {
        next(err);
    }
};

exports.obtenerProductos = async (req, res, next) => {
    try {
        const productos = await Producto.findAll();
        const categorias = await Categoria.findAll();
        res.json({ productos: productosDTO(productos), categorias });
    } catch (err) {
        next(err);
    }
};

exports.obtenerMisProductos = async (req, res, next) => {
    try {
        const id_oferente = req.user.oferenteId; // auth middleware
        const productos = await Producto.findByOferente(id_oferente);
        res.json({ productos: productosDTO(productos) });
    } catch (err) {
        next(err);
    }
};

exports.obtenerProducto = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const producto = await Producto.findById(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(productoDTO(producto));
    } catch (err) {
        next(err);
    }
};

exports.actualizarProducto = async (req, res, next) => {
    try {
        let data = { ...req.body };
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const productoOriginal = await Producto.findById(id);
        if (!productoOriginal) return res.status(404).json({ error: "Producto no encontrado" });

        // Authorization check. IDOR prevention.
        if (req.user && req.user.rol === 'oferente') {
            const oferenteUser = await Oferente.findByUserId(req.user.id);
            if (!oferenteUser || oferenteUser.id_oferente !== productoOriginal.id_oferente) {
                return res.status(403).json({ error: "No autorizado para modificar este producto" });
            }
        } else if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ error: "No autorizado" });
        }

        // normalizar imágenes si las mandan como string
        if (data.imagenes !== undefined) {
            if (typeof data.imagenes === "string") {
                try { data.imagenes = JSON.parse(data.imagenes); } catch {
                    data.imagenes = [];
                }
            }
            if (!Array.isArray(data.imagenes)) data.imagenes = [];
        }

        // Block changing ownership implicitly via PUT body
        delete data.id_oferente;

        const updated = await Producto.update(id, data);
        if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json({ message: 'Actualizado', producto: productoDTO(updated) });

    } catch (err) {
        next(err);
    }
};

exports.eliminarProducto = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const productoOriginal = await Producto.findById(id);
        if (!productoOriginal) return res.status(404).json({ error: "Producto no encontrado" });

        // Authorization check
        if (req.user && req.user.rol === 'oferente') {
            const oferenteUser = await Oferente.findByUserId(req.user.id);
            if (!oferenteUser || oferenteUser.id_oferente !== productoOriginal.id_oferente) {
                return res.status(403).json({ error: "No autorizado para eliminar este producto" });
            }
        } else if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ error: "No autorizado" });
        }

        const deleted = await Producto.delete(id);
        if (!deleted) return res.status(404).json({ error: 'No encontrado' });

        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        next(err);
    }
};
