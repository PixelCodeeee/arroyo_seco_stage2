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

        // Check if user has oferente role or is admin
        if (decoded.rol !== 'oferente' && decoded.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción. Debes ser oferente.'
            });
        }

        // Get oferente info from database
        const oferentes = await prisma.oferente.findMany({
            where: { id_usuario: decoded.id }
        });

        if (oferentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Oferente no encontrado. Por favor completa tu perfil de oferente.'
            });
        }

        req.user = decoded;
        req.user.oferenteId = oferentes[0].id_oferente; // Attach oferenteId to request
        req.oferente = oferentes[0];
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

module.exports = {
    verifyToken,
    verifyoferente,
    verifyAdmin
};
