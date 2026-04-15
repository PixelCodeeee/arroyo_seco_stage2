const jwt = require('jsonwebtoken');

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

// 🔥 Middleware flexible por roles
const verifyRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
        return res.status(403).json({
            success: false,
            message: 'No autorizado'
        });
    }
    next();
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

module.exports = {
    verifyToken,
    verifyRole,
    verifyAdmin
};