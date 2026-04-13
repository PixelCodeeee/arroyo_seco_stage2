const express = require('express');
const router = express.Router();
const redis = require('../utils/redis');

// Endpoints for Canary operations
router.get('/sessions/count', async (req, res, next) => {
    try {
        const group = req.query.group;
        if (!group) {
            return res.status(400).json({ error: 'Missing group parameter' });
        }

        // Clean up expired keys before counting (best effort)
        // Unfortunately redis SADD doesn't automatically drop missing keys in a set without specific maintenance, 
        // but we assume our logout/expiration mechanism is good enough for drain approximation.
        const count = await redis.scard(`active:${group}`);
        res.json({ group, active_sessions: count });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
