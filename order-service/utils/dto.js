// utils/dto.js

const carritoDTO = (item) => {
    if (!item) return null;
    return {
        id_carrito: item.id_carrito,
        id_usuario: item.id_usuario,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        fecha_agregado: item.fecha_agregado,
        producto: item.producto ? {
            id_producto: item.producto.id_producto,
            nombre: item.producto.nombre,
            precio: item.producto.precio,
            imagen: item.producto.imagen
        } : undefined
    };
};

const carritosDTO = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(carritoDTO);
};

const pedidoDTO = (pedido) => {
    if (!pedido) return null;
    return {
        id_pedido: pedido.id_pedido,
        id_usuario: pedido.id_usuario,
        nombre_usuario: pedido.nombre_usuario,
        email_usuario: pedido.email_usuario,
        fecha_pedido: pedido.fecha_creacion,      // ← corregido
        estado: pedido.estado,
        metodo_pago: pedido.metodo_pago,
        total: pedido.monto_total,                // ← corregido
        total_items: pedido.total_items,
        items: pedido.items ? pedido.items.map(d => ({
            id_item_pedido: d.id_item_pedido,
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_compra,     // ← corregido
            nombre_producto: d.nombre_producto,
            descripcion_producto: d.descripcion_producto,
            imagenes_producto: d.imagenes_producto,
            nombre_oferente: d.nombre_oferente
        })) : []
    };
};

const pedidosDTO = (pedidos) => {
    if (!Array.isArray(pedidos)) return [];
    return pedidos.map(pedidoDTO);
};

module.exports = {
    carritoDTO,
    carritosDTO,
    pedidoDTO,
    pedidosDTO
};
