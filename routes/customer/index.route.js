const express = require('express');
const authRoutes = require('./auth.route');
const customerController = require('../../controllers/customer/customer.controller');
const router = express.Router();
const Authorized = require('../../middlewares/jwtVerify')
router.use('/auth/', authRoutes);
router.post('/getupcomingbooks', customerController.getUpComingBookings);
router.post('/getmypageinfo', customerController.getMypageInfoByUserId);
router.put('/profile', customerController.updateCustomerProfile);
router.get('/booking/:id', Authorized,customerController.getBooking);
router.post('/savereview', customerController.saveReview);
router.post('/addremovefavorite', customerController.addRemovefavorite);
router.post('/bookbyuserid', customerController.bookSeat)
router.post("/ambassador", customerController.ambassador);
module.exports = router;