const express = require('express');
const authRoutes = require('./auth.route');
const adminRoutes = require('./admin.route');
const router = express.Router();

router.use('/auth/', authRoutes);
router.use('/v0/', adminRoutes);

module.exports = router;