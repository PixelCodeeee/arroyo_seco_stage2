const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

// 🔐 Verificar token (BASE para todos)
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // { id, correo, rol }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// 🔥 Middleware flexible por roles (RECOMENDADO)
const verifyRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
        return res.status(403).json({
            success: false,
            message: 'No autorizado'
        });
    }
    next();
};

// 👨‍🍳 Oferente (incluye admin y moderador)
const verifyoferente = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        const { rol, id } = req.user;

        if (!['oferente', 'admin', 'moderador'].includes(rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos de oferente'
            });
        }

        const oferentes = await prisma.oferente.findMany({
            where: { id_usuario: id }
        });

        if (oferentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Oferente no encontrado. Completa tu perfil.'
            });
        }

        req.user.oferenteId = oferentes[0].id_oferente;
        req.oferente = oferentes[0];

        next();
    } catch (error) {
        console.error('Error en verifyoferente:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// 👑 SOLO ADMIN
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Requiere privilegios de administrador'
        });
    }
    next();
};

// 👑 ADMIN + MODERADOR
const verifyAdminOrModerador = (req, res, next) => {
    if (!req.user || !['admin', 'moderador'].includes(req.user.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Requiere privilegios de administrador o moderador'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    verifyRole, // 🔥 nuevo (usa este mejor)
    verifyoferente,
    verifyAdmin,
    verifyAdminOrModerador
};