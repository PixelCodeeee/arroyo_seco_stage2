// utils/dto.js

const reservaDTO = (reserva) => {
    if (!reserva) return null;
    return {
        id_reserva: reserva.id_reserva,
        id_usuario: reserva.id_usuario,
        id_servicio: reserva.id_servicio,
        fecha: reserva.fecha,
        hora: reserva.hora,
        numero_personas: reserva.numero_personas,
        estado: reserva.estado,
        notas: reserva.notas,
        fecha_creacion: reserva.fecha_creacion,
        usuario: reserva.usuario ? {
            nombre: reserva.usuario.nombre,
            correo: reserva.usuario.correo,
        } : undefined,
        servicio: reserva.servicio ? {
            nombre: reserva.servicio.nombre,
            oferente: reserva.servicio.oferente ? {
                nombre: reserva.servicio.oferente.nombre_negocio,
            } : undefined,
        } : undefined,
    };
};

const reservasDTO = (reservas) => {
    if (!Array.isArray(reservas)) return [];
    return reservas.map(reservaDTO);
};

module.exports = {
    reservaDTO,
    reservasDTO
};
