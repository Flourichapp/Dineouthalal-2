const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/auth.controller');


router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/user', authController.createUser);
router.put('/user/:id', authController.updateUser);
router.delete('/user/:id', authController.deleteUser);

module.exports = router;
