const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');

// Crear pedido (generalmente se llamará desde el controlador de PayPal)
exports.crearPedido = async (req, res) => {
    try {
        const {
            id_usuario,
            items, // [{ id_producto, cantidad, precio_compra }]
            monto_total,
            estado = 'pendiente'
        } = req.body;

        // Validaciones básicas
        if (!id_usuario || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: "id_usuario e items son requeridos"
            });
        }

        if (!monto_total || monto_total <= 0) {
            return res.status(400).json({
                error: "monto_total debe ser mayor a 0"
            });
        }

        // Validar que el usuario exista
        const usuario = await Usuario.findById(id_usuario);
        if (!usuario) {
            return res.status(404).json({ error: "El usuario no existe" });
        }

        // Validar que todos los productos existan y calcular total
        let totalCalculado = 0;
        for (const item of items) {
            if (!item.id_producto || !item.cantidad || !item.precio_compra) {
                return res.status(400).json({
                    error: "Cada item debe tener id_producto, cantidad y precio_compra"
                });
            }

            const producto = await Producto.findById(item.id_producto);
            if (!producto) {
                return res.status(404).json({
                    error: `El producto ${item.id_producto} no existe`
                });
            }

            if (item.cantidad < 1) {
                return res.status(400).json({
                    error: "La cantidad debe ser al menos 1"
                });
            }

            totalCalculado += item.cantidad * item.precio_compra;
        }

        // Validar que el total coincida (con tolerancia de 0.01 por redondeo)
        if (Math.abs(totalCalculado - monto_total) > 0.01) {
            return res.status(400).json({
                error: "El monto total no coincide con la suma de los items"
            });
        }

        // Validar estado
        const estadosValidos = ['pendiente', 'pagado', 'enviado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "Estado inválido. Valores permitidos: pendiente, pagado, enviado"
            });
        }

        // Crear pedido
        const pedido = await Pedido.create({
            id_usuario,
            monto_total,
            estado,
            items
        });

        res.status(201).json({
            message: "Pedido creado exitosamente",
            pedido
        });

    } catch (error) {
        console.error("Error creating pedido:", error);
        res.status(500).json({ error: "Error al crear pedido" });
    }
};

// Obtener todos los pedidos
exports.obtenerPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.findAll();
        const stats = await Pedido.getStats();

        res.json({
            total: pedidos.length,
            stats,
            pedidos
        });
    } catch (error) {
        console.error('Error fetching pedidos:', error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
};

// Obtener pedido por ID
exports.obtenerPedidoPorId = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(pedido);
    } catch (error) {
        console.error('Error fetching pedido:', error);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
};

// Obtener pedidos por usuario
exports.obtenerPedidosPorUsuario = async (req, res) => {
    try {
        const pedidos = await Pedido.findByUsuarioId(req.params.usuarioId);

        res.json({
            total: pedidos.length,
            pedidos
        });
    } catch (error) {
        console.error('Error fetching pedidos:', error);
        res.status(500).json({ error: 'Error al obtener pedidos del usuario' });
    }
};

// Obtener pedidos por oferente
exports.obtenerPedidosPorOferente = async (req, res) => {
    try {
        const pedidos = await Pedido.findByOferenteId(req.params.oferenteId);
        const stats = await Pedido.getStatsByOferente(req.params.oferenteId);

        res.json({
            total: pedidos.length,
            stats,
            pedidos
        });
    } catch (error) {
        console.error('Error fetching pedidos:', error);
        res.status(500).json({ error: 'Error al obtener pedidos del oferente' });
    }
};

// Obtener pedidos por estado
exports.obtenerPedidosPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;

        const estadosValidos = ['pendiente', 'pagado', 'enviado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "Estado inválido. Valores permitidos: pendiente, pagado, enviado"
            });
        }

        const pedidos = await Pedido.findByEstado(estado);

        res.json({
            total: pedidos.length,
            estado,
            pedidos
        });
    } catch (error) {
        console.error('Error fetching pedidos:', error);
        res.status(500).json({ error: 'Error al obtener pedidos por estado' });
    }
};

// Cambiar estado de pedido
exports.cambiarEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        const id = req.params.id;

        if (!estado) {
            return res.status(400).json({ error: "El estado es requerido" });
        }

        const estadosValidos = ['pendiente', 'pagado', 'enviado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "Estado inválido. Valores permitidos: pendiente, pagado, enviado"
            });
        }

        const pedido = await Pedido.updateEstado(id, estado);

        if (!pedido) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        res.json({
            message: `Pedido actualizado a estado: ${estado}`,
            pedido
        });

    } catch (error) {
        console.error("Error changing estado:", error);
        res.status(500).json({ error: "Error al cambiar estado de pedido" });
    }
};

// Eliminar pedido
exports.eliminarPedido = async (req, res) => {
    try {
        const deleted = await Pedido.delete(req.params.id);

        res.json({
            message: 'Pedido eliminado exitosamente',
            id_pedido: req.params.id
        });

    } catch (error) {
        console.error('Error deleting pedido:', error);

        if (error.message.includes('pendiente')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
};
