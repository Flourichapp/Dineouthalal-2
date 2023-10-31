const express = require('express');
const router = express.Router();
const authController = require('../../controllers/customer/auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgotpassword', authController.forgotPassword);
router.post('/changepassword', authController.changePassword);
router.delete("/remove/:id",authController.removeUser)
module.exports = router;
