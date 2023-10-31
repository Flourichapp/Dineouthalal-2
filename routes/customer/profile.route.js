const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customer/customer.controller');

// routes

router.post('/getme', customerController.getMe);

module.exports = router;
