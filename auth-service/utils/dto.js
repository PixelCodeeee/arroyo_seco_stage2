// utils/dto.js

const usuarioDTO = (usuario) => {
    if (!usuario) return null;
    return {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        estatus: usuario.estatus,
        fecha_registro: usuario.fecha_registro,
        // specifically filter out 'contrasena'
        oferente: usuario.oferente ? usuario.oferente : undefined
    };
};

const usuariosDTO = (usuarios) => {
    if (!Array.isArray(usuarios)) return [];
    return usuarios.map(usuarioDTO);
};

module.exports = {
    usuarioDTO,
    usuariosDTO
};
