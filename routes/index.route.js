const express = require('express');
const adminRoutes = require('./admin/index.route');
const creatorRoutes = require('./creator/index.route');
const customerRoutes = require('./customer/index.route');
const landingRoutes = require('./landing.route');
const router = express.Router();

router.use('/admin/', adminRoutes);
router.use('/v1/', creatorRoutes);
router.use('/v2/', customerRoutes);
router.use('/v3/', landingRoutes);
// router.use('/user', userRoutes);
// router.use('/report/', reportRoutes);

module.exports = router;