const express = require('express');
const router = express.Router();
const redis = require('../utils/redis');

// Endpoints for Canary operations
const verifyInternalKey = (req, res, next) => {
    const key = req.headers['x-internal-key'];
    if (!process.env.INTERNAL_SERVICE_KEY || key !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

router.get('/sessions/count', verifyInternalKey, async (req, res, next) => {
    try {
        const group = req.query.group;
        if (!group) {
            return res.status(400).json({ error: 'Missing group parameter' });
        }

        const count = await redis.scard(`active:${group}`);
        res.json({ group, active_sessions: count });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
