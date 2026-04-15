// utils/dto.js

const servicioDTO = (servicio) => {
    if (!servicio) return null;
    return {
        id_servicio: servicio.id_servicio,
        id_oferente: servicio.id_oferente,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        rango_precio: servicio.rango_precio,
        capacidad: servicio.capacidad,
        imagenes: servicio.imagenes,
        estatus: servicio.estatus,
        fecha_creacion: servicio.fecha_creacion,
        oferente: servicio.oferente ? {
            id_oferente: servicio.oferente.id_oferente,
            // You can map further oferente fields here without exposing user secrets
            usuario: servicio.oferente.usuario ? {
                 nombre: servicio.oferente.usuario.nombre,
                 correo: servicio.oferente.usuario.correo
            } : undefined
        } : undefined
    };
};

const serviciosDTO = (servicios) => {
    if (!Array.isArray(servicios)) return [];
    return servicios.map(servicioDTO);
};

const oferenteDTO = (oferente) => {
    if (!oferente) return null;
    return {
        id_oferente: oferente.id_oferente,
        id_usuario: oferente.id_usuario,
        nombre_negocio: oferente.nombre_negocio,
        direccion: oferente.direccion,
        tipo: oferente.tipo,
        estado: oferente.estado,
        horario_disponibilidad: oferente.horario_disponibilidad,
        imagen: oferente.imagen,
        telefono: oferente.telefono,
        // specifically filter out mercadopago internal access tokens from public view unless explicitly permitted by controller
        mp_estado: oferente.mp_estado
    };
};

const oferentesDTO = (oferentes) => {
    if (!Array.isArray(oferentes)) return [];
    return oferentes.map(oferenteDTO);
};

const productoDTO = (producto) => {
    if (!producto) return null;
    return {
        id_producto: producto.id_producto,
        id_oferente: producto.id_oferente,
        id_categoria: producto.id_categoria,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: typeof producto.precio === 'object' && producto.precio !== null ? Number(producto.precio) : producto.precio,
        inventario: producto.inventario,
        imagenes: producto.imagenes,
        estatus: producto.estatus,
        oferente: oferenteDTO(producto.oferente),
        categoria: producto.categoria ? {
            id_categoria: producto.categoria.id_categoria,
            nombre: producto.categoria.nombre,
            tipo: producto.categoria.tipo
        } : undefined
    };
};

const productosDTO = (productos) => {
    if (!Array.isArray(productos)) return [];
    return productos.map(productoDTO);
};

module.exports = {
    servicioDTO,
    serviciosDTO,
    oferenteDTO,
    oferentesDTO,
    productoDTO,
    productosDTO
};
