const { profileEnd } = require('console');
const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/creator/booking.controller');

router.post('/getinfo', bookingController.getInfo);
router.get('', bookingController.getBookings);
router.post('/updatebookingstatus', bookingController.updateBookingStatus);

module.exports = router;
