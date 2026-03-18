// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', verifyToken, requireAdmin, adminController.getDashboard);

// Top oferentes
router.get('/top-oferentes', verifyToken, requireAdmin, adminController.getTopOferentes);

// Usuarios activos
router.get('/usuarios-activos', verifyToken, requireAdmin, adminController.getActiveUsers);

module.exports = router;