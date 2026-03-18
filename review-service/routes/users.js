// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Obtener perfil del usuario actual
router.get('/perfil', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.usuario.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Si es oferente, obtener info del negocio
        if (user.rol === 'oferente') {
            const business = await User.getOferenteInfo(user.id_usuario);
            user.negocio = business;
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar perfil
router.put('/perfil', verifyToken, async (req, res) => {
    try {
        const { nombre, telefono } = req.body;
        const userId = req.usuario.id;

        await promisePool.execute(
            'UPDATE usuario SET nombre = ?, telefono = ? WHERE id_usuario = ?',
            [nombre, telefono, userId]
        );

        const updatedUser = await User.findById(userId);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener usuario por ID (admin)
router.get('/:id_usuario', verifyToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id_usuario);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;