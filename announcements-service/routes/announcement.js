const express = require('express');
const router = express.Router();
const controller = require('../controllers/announcementController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Público — only active announcements
router.get('/public', controller.getPublicAnnouncement);

// Protected CRUD — admin + moderador can read all, admin only can write
router.get('/', verifyToken, verifyRole(['admin', 'moderador']), controller.getAll);
router.get('/:id', controller.getById);
router.post('/', verifyToken, verifyRole(['admin']), controller.create);
router.put('/:id', verifyToken, verifyRole(['admin']), controller.update);
router.delete('/:id', verifyToken, verifyRole(['admin']), controller.remove);

module.exports = router;