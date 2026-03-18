// review-service/routes/responses.js
const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const { verifyToken, requireOferente } = require('../middleware/auth');
const { verifyCanRespond } = require('../middleware/roles');

router.post('/review/:id_review', verifyToken, requireOferente, verifyCanRespond, responseController.createResponse);
router.put('/:id_response', verifyToken, requireOferente, responseController.updateResponse);
router.delete('/:id_response', verifyToken, requireOferente, responseController.deleteResponse);

module.exports = router;