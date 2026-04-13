const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const { pedidoDTO, pedidosDTO } = require('../utils/dto');

// Crear pedido (generalmente se llamará desde el controlador de PayPal)
exports.crearPedido = async (req, res, next) => {
    try {
        let {
            id_usuario,
            items, // [{ id_producto, cantidad, precio_compra }]
            monto_total,
            estado = 'pendiente'
        } = req.body;

        id_usuario = parseInt(id_usuario, 10);
        monto_total = parseFloat(monto_total);

        // Validaciones básicas
        if (isNaN(id_usuario) || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "id_usuario válido e items son requeridos" });
        }

        // Authorization check - IDOR prevention. A user can only create an order for themselves.
        if (req.user && req.user.rol === 'turista' && req.user.id !== id_usuario) {
            return res.status(403).json({ error: "No autorizado a crear pedidos para otro usuario" });
        }

        if (isNaN(monto_total) || monto_total <= 0) {
            return res.status(400).json({ error: "monto_total debe ser mayor a 0" });
        }

        // Validar que el usuario exista
        const usuario = await Usuario.findById(id_usuario);
        if (!usuario) {
            return res.status(404).json({ error: "El usuario no existe" });
        }

        // Validar que todos los productos existan y calcular total
        let totalCalculado = 0;
        for (const item of items) {
            item.id_producto = parseInt(item.id_producto, 10);
            item.cantidad = parseInt(item.cantidad, 10);
            item.precio_compra = parseFloat(item.precio_compra);

            if (isNaN(item.id_producto) || isNaN(item.cantidad) || isNaN(item.precio_compra)) {
                return res.status(400).json({ error: "Cada item debe tener id_producto, cantidad y precio_compra válidos" });
            }

            const producto = await Producto.findById(item.id_producto);
            if (!producto) {
                return res.status(404).json({ error: `El producto ${item.id_producto} no existe` });
            }

            if (item.cantidad < 1) {
                return res.status(400).json({ error: "La cantidad debe ser al menos 1" });
            }

            totalCalculado += item.cantidad * item.precio_compra;
        }

        // Validar que el total coincida (con tolerancia de 0.01 por redondeo)
        if (Math.abs(totalCalculado - monto_total) > 0.01) {
            return res.status(400).json({ error: "El monto total no coincide con la suma de los items" });
        }

        // Validar estado
        const estadosValidos = ['pendiente', 'pagado', 'enviado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: "Estado inválido. Valores permitidos: pendiente, pagado, enviado" });
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
            pedido: pedidoDTO(pedido)
        });

    } catch (error) {
        next(error);
    }
};

// Obtener todos los pedidos (o los correspondientes al rol)
exports.obtenerPedidos = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        let pedidos = [];
        let stats = null;

        if (req.user.rol === 'admin') {
            pedidos = await Pedido.findAll();
            stats = await Pedido.getStats();
        } else if (req.user.rol === 'turista') {
            pedidos = await Pedido.findByUsuarioId(req.user.id);
        } else if (req.user.rol === 'oferente') {
            if (!req.user.oferenteId) {
                // Fetch oferenteId dynamically if not injected by verifyoferente
                const { prisma } = require('../config/db');
                const oferentes = await prisma.oferente.findMany({ where: { id_usuario: req.user.id } });
                if (oferentes.length > 0) {
                    pedidos = await Pedido.findByOferenteId(oferentes[0].id_oferente);
                    stats = await Pedido.getStatsByOferente(oferentes[0].id_oferente);
                }
            } else {
                pedidos = await Pedido.findByOferenteId(req.user.oferenteId);
                stats = await Pedido.getStatsByOferente(req.user.oferenteId);
            }
        }

        res.json({
            total: pedidos.length,
            stats,
            pedidos: pedidosDTO(pedidos)
        });
    } catch (error) {
        next(error);
    }
};

// Obtener pedido por ID
exports.obtenerPedidoPorId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const pedido = await Pedido.findById(id);

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // IDOR checking. A user can only see their own order. Admin can see any. 
        if (req.user && req.user.rol === 'turista' && pedido.id_usuario !== req.user.id) {
            return res.status(403).json({ error: "No autorizado para ver este pedido" });
        }

        if (req.user && req.user.rol === 'oferente' && pedido.id_oferente !== req.user.oferenteId) {
            return res.status(403).json({ error: "No autorizado para ver este pedido de otro oferente" });
        }

        res.json(pedidoDTO(pedido));
    } catch (error) {
        next(error);
    }
};

// Obtener pedidos por usuario
exports.obtenerPedidosPorUsuario = async (req, res, next) => {
    try {
        const usuarioId = parseInt(req.params.usuarioId, 10);
        if (isNaN(usuarioId)) return res.status(400).json({ error: 'ID de usuario inválido' });

        if (req.user && req.user.rol === 'turista' && req.user.id !== usuarioId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const pedidos = await Pedido.findByUsuarioId(usuarioId);

        res.json({
            total: pedidos.length,
            pedidos: pedidosDTO(pedidos)
        });
    } catch (error) {
        next(error);
    }
};

// Obtener pedidos por oferente
exports.obtenerPedidosPorOferente = async (req, res, next) => {
    try {
        const oferenteId = parseInt(req.params.oferenteId, 10);
        if (isNaN(oferenteId)) return res.status(400).json({ error: 'ID de oferente inválido' });

        if (req.user && req.user.rol === 'oferente' && req.user.oferenteId !== oferenteId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const pedidos = await Pedido.findByOferenteId(oferenteId);
        const stats = await Pedido.getStatsByOferente(oferenteId);

        res.json({
            total: pedidos.length,
            stats,
            pedidos: pedidosDTO(pedidos)
        });
    } catch (error) {
        next(error);
    }
};

// Obtener pedidos por estado
exports.obtenerPedidosPorEstado = async (req, res, next) => {
    try {
        const { estado } = req.params;

        const estadosValidos = ['pendiente', 'pagado', 'enviado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: "Estado inválido. Valores permitidos: pendiente, pagado, enviado" });
        }

        const pedidos = await Pedido.findByEstado(estado);

        res.json({
            total: pedidos.length,
            estado,
            pedidos: pedidosDTO(pedidos)
        });
    } catch (error) {
        next(error);
    }
};

// Cambiar estado de pedido
exports.cambiarEstado = async (req, res, next) => {
    try {
        const { estado } = req.body;
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID de pedido inválido' });

        if (!estado) return res.status(400).json({ error: "El estado es requerido" });

        const estadosValidos = ['pendiente', 'pagado', 'enviado', 'completado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: "Estado inválido" });
        }

        const pedidoOriginal = await Pedido.findById(id);
        if (!pedidoOriginal) return res.status(404).json({ error: "Pedido no encontrado" });

        // IDOR check
        if (req.user.rol === 'turista') {
            return res.status(403).json({ error: "Turistas no pueden cambiar estado de pedidos" });
        }

        if (req.user.rol === 'oferente') {
            // Verificar que el pedido contiene productos del oferente
            const { prisma } = require('../config/db');
            const oferentes = await prisma.oferente.findMany({ where: { id_usuario: req.user.id } });
            if (oferentes.length === 0) return res.status(403).json({ error: "No autorizado" });

            const oferenteId = req.user.oferenteId || oferentes[0].id_oferente;
            const tieneProductos = pedidoOriginal.items?.some(
                item => item.nombre_oferente && oferentes[0].nombre_negocio &&
                    item.nombre_oferente === oferentes[0].nombre_negocio
            );

            // Safer: check via DB
            const itemsDelOferente = await prisma.itemPedido.findFirst({
                where: {
                    id_pedido: id,
                    producto: { id_oferente: oferenteId }
                }
            });

            if (!itemsDelOferente) {
                return res.status(403).json({ error: "No autorizado para modificar este pedido" });
            }
        }

        const pedido = await Pedido.updateEstado(id, estado);
        res.json({
            message: `Pedido actualizado a estado: ${estado}`,
            pedido: pedidoDTO(pedido)
        });

    } catch (error) {
        next(error);
    }
};

// Eliminar pedido
exports.eliminarPedido = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID de pedido inválido' });

        const pedidoOriginal = await Pedido.findById(id);
        if (!pedidoOriginal) return res.status(404).json({ error: "Pedido no encontrado" });

        if (req.user && req.user.rol === 'turista' && pedidoOriginal.id_usuario !== req.user.id) {
            return res.status(403).json({ error: "No autorizado para eliminar este pedido" });
        }

        if (req.user && req.user.rol === 'oferente') {
            return res.status(403).json({ error: "Los oferentes no pueden eliminar pedidos" });
        }

        const deleted = await Pedido.delete(id);

        res.json({
            message: 'Pedido eliminado exitosamente',
            id_pedido: id
        });

    } catch (error) {
        if (error.message && error.message.includes('pendiente')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

// Top productos más vendidos (recomendaciones)
exports.getTopProductos = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const productos = await Pedido.getTopProductos(limit);
        res.json({
            total: productos.length,
            productos
        });
    } catch (error) {
        next(error);
    }
};

// Stats para analíticas (solo admin)
exports.getStatsAnaliticas = async (req, res, next) => {
    try {
        const stats = await Pedido.getStatsAnaliticas();
        res.json(stats);
    } catch (error) {
        next(error);
    }
};