const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const { carritoDTO, carritosDTO } = require('../utils/dto');

// Obtener carrito del usuario
exports.getCarrito = async (req, res, next) => {
    try {
        const id_usuario = req.user.id; 

        if (isNaN(id_usuario)) return res.status(400).json({ error: "Usuario ID inválido" });

        const items = await Carrito.findByUsuario(id_usuario);
        const total = await Carrito.getTotal(id_usuario);
        const cantidadItems = await Carrito.getItemCount(id_usuario);

        res.json({
            success: true,
            data: {
                items: carritosDTO(items),
                total,
                cantidadItems
            }
        });
    } catch (error) {
        next(error);
    }
};

// Agregar producto al carrito
exports.agregarAlCarrito = async (req, res, next) => {
    try {
        const id_usuario = req.user.id;
        let { id_producto, cantidad = 1 } = req.body;

        id_producto = parseInt(id_producto, 10);
        cantidad = parseInt(cantidad, 10);

        if (isNaN(id_producto) || isNaN(cantidad) || cantidad < 1) {
             return res.status(400).json({ error: "id_producto y cantidad deben ser válidos" });
        }

        // Validar que el producto existe y está disponible
        const producto = await Producto.findById(id_producto);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (!producto.estatus) {
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
        next(error);
    }
};

// Actualizar cantidad de un item
exports.actualizarCantidad = async (req, res, next) => {
    try {
        const id_carrito = parseInt(req.params.id_carrito, 10);
        const cantidad = parseInt(req.body.cantidad, 10);

        if (isNaN(id_carrito) || isNaN(cantidad) || cantidad < 0) {
            return res.status(400).json({
                success: false,
                message: 'ID o Cantidad inválida'
            });
        }
        
        // Authorization logic for Carrito bounds
        const item = await Carrito.findById(id_carrito);
        if (!item) {
             return res.status(404).json({ success: false, message: 'Item no encontrado' });
        }
        if (item.id_usuario !== req.user.id) {
             return res.status(403).json({ success: false, message: 'No autorizado para modificar este carrito' });
        }

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
        next(error);
    }
};

// Eliminar item del carrito
exports.eliminarItem = async (req, res, next) => {
    try {
        const id_carrito = parseInt(req.params.id_carrito, 10);
        if (isNaN(id_carrito)) return res.status(400).json({ error: "ID de carrito inválido" });

        const item = await Carrito.findById(id_carrito);
        if (!item) {
             return res.status(404).json({ success: false, message: 'Item no encontrado' });
        }
        if (item.id_usuario !== req.user.id) {
             return res.status(403).json({ success: false, message: 'No autorizado para modificar este carrito' });
        }
        
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
        next(error);
    }
};

// Vaciar carrito completo
exports.vaciarCarrito = async (req, res, next) => {
    try {
        const id_usuario = req.user.id;
        const itemsEliminados = await Carrito.clearCarrito(id_usuario);

        res.json({
            success: true,
            message: 'Carrito vaciado exitosamente',
            itemsEliminados
        });
    } catch (error) {
        next(error);
    }
};

// Verificar disponibilidad de productos en el carrito
exports.verificarDisponibilidad = async (req, res, next) => {
    try {
        const id_usuario = req.user.id;
        const disponibilidad = await Carrito.verificarDisponibilidad(id_usuario);

        res.json({
            success: true,
            data: disponibilidad
        });
    } catch (error) {
        next(error);
    }
};

// Obtener carrito agrupado por oferente (útil para checkout)
exports.getCarritoAgrupado = async (req, res, next) => {
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
        next(error);
    }
};

// Obtener resumen del carrito (para el badge del navbar)
exports.getResumenCarrito = async (req, res, next) => {
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
        next(error);
    }
};
