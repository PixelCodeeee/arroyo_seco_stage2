const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');

// Obtener carrito del usuario
exports.getCarrito = async (req, res) => {
    try {
        const id_usuario = req.user.id; // Corrected: from 'id' in token (Usuario model uses 'id_usuario' but token usually has 'id')
        // Wait, let's check auth middleware in auth-service.
        // In auth-service/middleware/auth.js: req.user = decoded;
        // In auth-service/controllers/usuarioController.js: token payload is { id: usuario.id_usuario, ... }
        // So req.user.id is correct.

        const items = await Carrito.findByUsuario(id_usuario);
        const total = await Carrito.getTotal(id_usuario);
        const cantidadItems = await Carrito.getItemCount(id_usuario);

        res.json({
            success: true,
            data: {
                items,
                total,
                cantidadItems
            }
        });
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carrito',
            error: error.message
        });
    }
};

// Agregar producto al carrito
exports.agregarAlCarrito = async (req, res) => {
    try {
        const id_usuario = req.user.id;
        const { id_producto, cantidad = 1 } = req.body;

        // Validar que el producto existe y está disponible
        const producto = await Producto.findById(id_producto);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (!producto.esta_disponible) {
            return res.status(400).json({
                success: false,
                message: 'Producto no disponible'
            });
        }

        // Verificar stock disponible
        const stockDisponible = await Producto.checkStock(id_producto, cantidad);

        if (!stockDisponible) {
            return res.status(400).json({
                success: false,
                message: 'Stock insuficiente',
                stockDisponible: producto.inventario
            });
        }

        // Agregar al carrito
        const id_carrito = await Carrito.addItem(id_usuario, id_producto, cantidad);

        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: { id_carrito }
        });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito',
            error: error.message
        });
    }
};

// Actualizar cantidad de un item
exports.actualizarCantidad = async (req, res) => {
    try {
        const { id_carrito } = req.params;
        const { cantidad } = req.body;

        if (cantidad < 0) {
            return res.status(400).json({
                success: false,
                message: 'Cantidad inválida'
            });
        }

        // TODO: Agregar validación de que el carrito pertenece al usuario

        const actualizado = await Carrito.updateCantidad(id_carrito, cantidad);

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        res.json({
            success: true,
            message: cantidad === 0 ? 'Item eliminado del carrito' : 'Cantidad actualizada'
        });
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cantidad',
            error: error.message
        });
    }
};

// Eliminar item del carrito
exports.eliminarItem = async (req, res) => {
    try {
        const { id_carrito } = req.params;

        // TODO: Agregar validación de que el carrito pertenece al usuario

        const eliminado = await Carrito.removeItem(id_carrito);

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Item eliminado del carrito'
        });
    } catch (error) {
        console.error('Error al eliminar item:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item',
            error: error.message
        });
    }
};

// Vaciar carrito completo
exports.vaciarCarrito = async (req, res) => {
    try {
        const id_usuario = req.user.id;

        const itemsEliminados = await Carrito.clearCarrito(id_usuario);

        res.json({
            success: true,
            message: 'Carrito vaciado exitosamente',
            itemsEliminados
        });
    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar carrito',
            error: error.message
        });
    }
};

// Verificar disponibilidad de productos en el carrito
exports.verificarDisponibilidad = async (req, res) => {
    try {
        const id_usuario = req.user.id;

        const disponibilidad = await Carrito.verificarDisponibilidad(id_usuario);

        res.json({
            success: true,
            data: disponibilidad
        });
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar disponibilidad',
            error: error.message
        });
    }
};

// Obtener carrito agrupado por oferente (útil para checkout)
exports.getCarritoAgrupado = async (req, res) => {
    try {
        const id_usuario = req.user.id;

        const carritoAgrupado = await Carrito.getCarritoAgrupadoPoroferente(id_usuario);
        const total = await Carrito.getTotal(id_usuario);

        res.json({
            success: true,
            data: {
                oferentes: carritoAgrupado,
                totalGeneral: total
            }
        });
    } catch (error) {
        console.error('Error al obtener carrito agrupado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carrito agrupado',
            error: error.message
        });
    }
};

// Obtener resumen del carrito (para el badge del navbar)
exports.getResumenCarrito = async (req, res) => {
    try {
        const id_usuario = req.user.id;

        const cantidadItems = await Carrito.getItemCount(id_usuario);
        const total = await Carrito.getTotal(id_usuario);

        res.json({
            success: true,
            data: {
                cantidadItems,
                total
            }
        });
    } catch (error) {
        console.error('Error al obtener resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen del carrito',
            error: error.message
        });
    }
};
