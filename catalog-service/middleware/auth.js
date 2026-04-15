const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

// Verify if user is authenticated
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
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// Verify if user is an oferente
const verifyoferente = async (req, res, next) => {
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
        req.user = decoded;

        // ✅ Only allow oferente or admin
        if (decoded.rol !== 'oferente' && decoded.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción.'
            });
        }

        // ✅ Admin bypass (CRITICAL FIX)
        if (decoded.rol === 'admin') {
            return next();
        }

        // ✅ Only oferentes reach this point
        const oferente = await prisma.oferente.findFirst({
            where: { id_usuario: decoded.id }
        });

        if (!oferente) {
            return res.status(403).json({
                success: false,
                message: 'Debes completar tu perfil de oferente'
            });
        }

        req.user.oferenteId = oferente.id_oferente;
        req.oferente = oferente;

        next();

    } catch (error) {
        console.error('Error in verifyoferente middleware:', error);
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
            error: error.message
        });
    }
};

// Verify if user is admin
const verifyAdmin = (req, res, next) => {
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

        if (decoded.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Requiere privilegios de administrador'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// Optional auth — sets req.user if a valid token is present, but does NOT reject if missing/invalid
const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token && process.env.JWT_SECRET) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
    } catch {
        // Token invalid/expired — continue as unauthenticated
    }
    next();
};

module.exports = {
    verifyToken,
    verifyoferente,
    verifyAdmin,
    optionalAuth
};
