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
        fecha_pedido: pedido.fecha_pedido,
        estado: pedido.estado,
        total: pedido.total,
        direccion_envio: pedido.direccion_envio,
        detalles: pedido.detalles ? pedido.detalles.map(d => ({
             id_detalle: d.id_detalle,
             id_producto: d.id_producto,
             cantidad: d.cantidad,
             precio_unitario: d.precio_unitario
        })) : undefined
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
