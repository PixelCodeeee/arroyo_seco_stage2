const { prisma } = require('../config/db');

const verifyAdmin = async (req, res, next) => {
    try {
        const oferente = await prisma.oferente.findFirst({
            where: { user_id: req.user.id }
        });

        if (!oferente || !oferente.is_admin) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { verifyAdmin };