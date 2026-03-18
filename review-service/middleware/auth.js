// review-service/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

const requireCliente = (req, res, next) => {
    if (req.usuario.rol !== 'turista') {
        return res.status(403).json({ error: 'Acceso solo para clientes' });
    }
    next();
};

const requireOferente = (req, res, next) => {
    if (req.usuario.rol !== 'oferente') {
        return res.status(403).json({ error: 'Acceso solo para oferentes' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso solo para administradores' });
    }
    next();
};

module.exports = {
    verifyToken,
    requireCliente,
    requireOferente,
    requireAdmin
};