const express = require('express');
const router = express.Router();
const authController = require('../../controllers/creator/auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgotpassword', authController.forgotPassword);

module.exports = router;