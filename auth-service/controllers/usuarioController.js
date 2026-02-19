const Usuario = require('../models/Usuario');
const Codigo2FA = require('../models/Codigo2FA');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

// Allowed roles
const ROLES_VALIDOS = ['turista', 'oferente', 'admin'];

// CREATE - Register new user (with 2FA)
exports.crearUsuario = async (req, res) => {
    try {
        const { correo, contrasena, nombre, rol } = req.body;

        if (!correo || !contrasena || !nombre || !rol) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos: correo, contrasena, nombre, rol'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({
                error: 'Formato de correo inválido'
            });
        }

        if (!ROLES_VALIDOS.includes(rol)) {
            return res.status(400).json({
                error: `Rol inválido. Debe ser: ${ROLES_VALIDOS.join(', ')}`
            });
        }

        if (contrasena.length < 6) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const existingUser = await Usuario.findByEmail(correo);
        if (existingUser) {
            return res.status(409).json({
                error: 'El correo ya está registrado'
            });
        }

        const usuario = await Usuario.create({ correo, contrasena, nombre, rol });

        const codigo = await Codigo2FA.create(usuario.id_usuario);
        await emailService.send2FACode(correo, codigo, nombre);

        res.status(201).json({
            message: 'Usuario creado. Por favor verifica tu correo',
            requiresVerification: true,
            userId: usuario.id_usuario
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

// LOGIN - Step 1: Verify credentials and send 2FA code
exports.loginUsuario = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({
                error: 'Correo y contraseña son requeridos'
            });
        }

        const usuario = await Usuario.findByEmail(correo);
        if (!usuario) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        const isPasswordValid = await Usuario.verifyPassword(contrasena, usuario.contrasena_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        const codigo = await Codigo2FA.create(usuario.id_usuario);
        await emailService.send2FACode(correo, codigo, usuario.nombre);

        res.json({
            message: 'Código de verificación enviado a tu correo',
            requiresVerification: true,
            userId: usuario.id_usuario
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

// LOGIN - Step 2: Verify 2FA code and issue token
exports.verify2FA = async (req, res) => {
    try {
        const { userId, codigo } = req.body;

        if (!userId || !codigo) {
            return res.status(400).json({
                error: 'Usuario y código son requeridos'
            });
        }

        const isValid = await Codigo2FA.verify(userId, codigo);

        if (!isValid) {
            return res.status(401).json({
                error: 'Código inválido o expirado'
            });
        }

        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol },
            process.env.JWT_SECRET || '123',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Autenticación exitosa',
            token: token,
            user: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                nombre: usuario.nombre,
                rol: usuario.rol,
                esta_activo: usuario.esta_activo
            }
        });
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ error: 'Error al verificar el código' });
    }
};

// Resend 2FA code
exports.resend2FACode = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Usuario requerido' });
        }

        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const codigo = await Codigo2FA.create(userId);
        await emailService.send2FACode(usuario.correo, codigo, usuario.nombre);

        res.json({ message: 'Código reenviado exitosamente' });
    } catch (error) {
        console.error('Error resending 2FA code:', error);
        res.status(500).json({ error: 'Error al reenviar el código' });
    }
};

exports.obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll();
        res.json({
            total: usuarios.length,
            usuarios
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

exports.obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};

exports.actualizarUsuario = async (req, res) => {
    try {
        const { correo, contrasena, nombre, rol, esta_activo } = req.body;
        const userId = req.params.id;

        const existingUser = await Usuario.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (correo) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                return res.status(400).json({
                    error: 'Formato de correo inválido'
                });
            }

            const emailExists = await Usuario.emailExists(correo, userId);
            if (emailExists) {
                return res.status(409).json({
                    error: 'El correo ya está registrado por otro usuario'
                });
            }
        }

        if (rol && !ROLES_VALIDOS.includes(rol)) {
            return res.status(400).json({
                error: `Rol inválido. Debe ser: ${ROLES_VALIDOS.join(', ')}`
            });
        }

        if (contrasena && contrasena.length < 6) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const usuario = await Usuario.update(userId, {
            correo,
            contrasena,
            nombre,
            rol,
            esta_activo
        });

        if (!usuario) {
            return res.status(400).json({
                error: 'No hay campos para actualizar'
            });
        }

        res.json({
            message: 'Usuario actualizado exitosamente',
            usuario
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        const deleted = await Usuario.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            message: 'Usuario eliminado exitosamente',
            id_usuario: req.params.id
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};
