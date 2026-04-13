const Usuario = require('../models/Usuario');
const Codigo2FA = require('../models/Codigo2FA');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');
const { usuarioDTO, usuariosDTO } = require('../utils/dto');
const redis = require('../utils/redis');

// Allowed roles
const ROLES_VALIDOS = ['turista', 'oferente', 'admin'];

// CREATE - Register new user (with 2FA)
exports.crearUsuario = async (req, res, next) => {
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
            if (existingUser.esta_activo) {
                return res.status(409).json({
                    error: 'El correo ya está registrado'
                });
            } else {
                // If they never finished 2FA, allow them to re-register
                await Usuario.delete(existingUser.id_usuario);
            }
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
        next(error);
    }
};

// LOGIN - Step 1: Verify credentials and send 2FA code
exports.loginUsuario = async (req, res, next) => {
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
        
        if (!usuario.esta_activo) {
            return res.status(403).json({
                error: 'Cuenta no verificada. Por favor regístrate nuevamente.'
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
        next(error);
    }
};

// LOGIN - Step 2: Verify 2FA code and issue token
exports.verify2FA = async (req, res, next) => {
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

        let usuario = await Usuario.findById(userId);

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Activates the user since 2FA is verified successfully 
        if (!usuario.esta_activo) {
            usuario = await Usuario.update(userId, { esta_activo: true });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Session tracking for Canary Deployments
        const group = req.headers['x-frontend-version'] || 'stable';
        const jwtTtlSeconds = 24 * 60 * 60; // 24 hours
        // Normally tying to token involves an ID. We can use the hashed token signature, or just randomly generate a session ID. 
        // JWT itself is the key or we can track by user ID. Let's use user ID combined with a prefix.
        const tokenId = usuario.id_usuario; 
        await redis.setex(`session:${tokenId}`, jwtTtlSeconds, group);
        await redis.sadd(`active:${group}`, tokenId);
        await redis.expire(`active:${group}`, jwtTtlSeconds);

        res.json({
            message: 'Autenticación exitosa',
            token: token,
            user: usuarioDTO(usuario)
        });
    } catch (error) {
        next(error);
    }
};

// LOGOUT - Clear session tracking
exports.logoutUsuario = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
             return res.status(401).json({ error: 'No autenticado' });
        }
        
        const tokenId = req.user.id;
        const group = await redis.get(`session:${tokenId}`);
        if (group) {
            await redis.srem(`active:${group}`, tokenId);
        }
        await redis.del(`session:${tokenId}`);

        res.json({ message: 'Sesión finalizada exitosamente' });
    } catch (error) {
        next(error);
    }
};

// Resend 2FA code
exports.resend2FACode = async (req, res, next) => {
    try {
        let { userId } = req.body;
        userId = parseInt(userId, 10);

        if (isNaN(userId)) return res.status(400).json({ error: 'Usuario requerido y válido' });

        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const codigo = await Codigo2FA.create(userId);
        await emailService.send2FACode(usuario.correo, codigo, usuario.nombre);

        res.json({ message: 'Código reenviado exitosamente' });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { correo } = req.body;
        if (!correo) return res.status(400).json({ error: 'Correo requerido' });

        const usuario = await Usuario.findByEmail(correo);
        if (!usuario) {
            return res.json({ message: 'Si el correo existe, el código fue enviado.' });
        }

        const codigo = await Codigo2FA.create(usuario.id_usuario);
        await emailService.sendPasswordResetCode(correo, codigo, usuario.nombre);

        res.json({ message: 'Si el correo existe, el código fue enviado.' });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { correo, codigo, nuevaContrasena } = req.body;
        if (!correo || !codigo || !nuevaContrasena) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        if (nuevaContrasena.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const usuario = await Usuario.findByEmail(correo);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isValid = await Codigo2FA.verify(usuario.id_usuario, codigo);
        if (!isValid) return res.status(401).json({ error: 'Código inválido o expirado' });

        await Usuario.update(usuario.id_usuario, { contrasena: nuevaContrasena });

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        const { contrasenaActual, nuevaContrasena } = req.body;
        const userId = parseInt(req.params.id, 10);

        if (isNaN(userId)) return res.status(400).json({ error: "ID inválido" });

        if (req.user.id !== userId && req.user.rol !== 'admin') {
            return res.status(403).json({ error: 'No autorizado para cambiar la contraseña de este usuario' });
        }

        if (!contrasenaActual || !nuevaContrasena) {
            return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
        }

        const usuarioFull = await Usuario.findByEmail(req.user.correo);
        if (!usuarioFull) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isPasswordValid = await Usuario.verifyPassword(contrasenaActual, usuarioFull.contrasena_hash);
        if (!isPasswordValid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

        await Usuario.update(userId, { contrasena: nuevaContrasena });

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        next(error);
    }
};

exports.obtenerUsuarios = async (req, res, next) => {
    try {
        const usuarios = await Usuario.findAll();
        res.json({
            total: usuarios.length,
            usuarios: usuariosDTO(usuarios)
        });
    } catch (error) {
        next(error);
    }
};

exports.obtenerUsuarioPorId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        const usuario = await Usuario.findById(id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Return safely without IDOR protection here as profiles might be safe to view 
        // Or if strictly private, we could add: if (req.user.rol === 'turista' && req.user.id !== id) error;

        res.json(usuarioDTO(usuario));
    } catch (error) {
        next(error);
    }
};

exports.actualizarUsuario = async (req, res, next) => {
    try {
        const { correo, contrasena, nombre, rol, esta_activo } = req.body;
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) return res.status(400).json({ error: "ID inválido" });

        if (req.user && req.user.rol !== 'admin' && req.user.id !== userId) {
             return res.status(403).json({ error: 'No autorizado' });
        }

        const existingUser = await Usuario.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Email changes must go through the dedicated 2FA verification flow.
        if (correo && correo !== existingUser.correo) {
            return res.status(400).json({
                error: 'Para cambiar el correo, debe utilizar el flujo de verificación de correo seguro (/cambio-correo/solicitar)'
            });
        }

        // Correo is blocked above, but we keep this empty shell just in case
        if (correo && correo !== existingUser.correo) {
             // Blocked previously
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
            usuario: usuarioDTO(usuario)
        });
    } catch (error) {
        next(error);
    }
};

exports.eliminarUsuario = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

        if (req.user && req.user.rol !== 'admin' && req.user.id !== id) {
             return res.status(403).json({ error: 'No autorizado' });
        }

        const deleted = await Usuario.delete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            message: 'Usuario eliminado exitosamente',
            id_usuario: id
        });
    } catch (error) {
        next(error);
    }
};

// Stats para analíticas (solo admin)
exports.getStats = async (req, res, next) => {
    try {
        const stats = await Usuario.getStats();
        const registrosPorMes = await Usuario.getRegistrosPorMes();
        res.json({ stats, registrosPorMes });
    } catch (error) {
        next(error);
    }
};

exports.solicitarCambioCorreo = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { nuevoCorreo } = req.body;

        if (isNaN(userId)) return res.status(400).json({ error: "ID inválido" });
        if (!nuevoCorreo) return res.status(400).json({ error: "El nuevo correo es requerido" });

        if (req.user && req.user.rol !== 'admin' && req.user.id !== userId) {
             return res.status(403).json({ error: 'No autorizado' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(nuevoCorreo)) {
            return res.status(400).json({ error: 'Formato de correo inválido' });
        }

        const emailExists = await Usuario.emailExists(nuevoCorreo, userId);
        if (emailExists) {
            return res.status(409).json({ error: 'El correo ya está registrado por otro usuario' });
        }

        const usuario = await Usuario.findById(userId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Generate 6-digit verification code using Codigo2FA module natively
        const codigo = await Codigo2FA.create(userId);

        // Send email
        await emailService.sendEmailChangeCode(nuevoCorreo, codigo, usuario.nombre);

        // Sign token encapsulating request memory
        const changeToken = jwt.sign(
            { userId, nuevoCorreo, type: 'email_change' },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.json({
            message: 'Código de verificación enviado al nuevo correo',
            changeToken
        });

    } catch (error) {
        next(error);
    }
};

exports.verificarCambioCorreo = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { changeToken, codigo } = req.body;

        if (isNaN(userId)) return res.status(400).json({ error: "ID inválido" });
        if (!changeToken || !codigo) return res.status(400).json({ error: "Token y código son requeridos" });

        if (req.user && req.user.rol !== 'admin' && req.user.id !== userId) {
             return res.status(403).json({ error: 'No autorizado' });
        }

        let decoded;
        try {
            decoded = jwt.verify(changeToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Flujo de cambio de correo inválido o expirado' });
        }

        if (decoded.userId !== userId || decoded.type !== 'email_change') {
            return res.status(400).json({ error: 'Token inválido para esta operación' });
        }

        const isValid = await Codigo2FA.verify(userId, codigo);
        if (!isValid) return res.status(401).json({ error: 'Código inválido o expirado' });

        const usuario = await Usuario.update(userId, { correo: decoded.nuevoCorreo });

        res.json({
            message: 'Correo actualizado exitosamente',
            usuario: usuarioDTO(usuario)
        });

    } catch (error) {
        next(error);
    }
};
