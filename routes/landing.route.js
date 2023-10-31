const express = require('express');
const router = express.Router();
const landingController = require('../controllers/landing.controller');
const {getBlogs} = require('../controllers/Blogs/blogsController');
router.post('/getsearchdata', landingController.getRestSearchData);
router.get('/getsinglemetadata', landingController.getmetadatasingle);
router.post('/getrestdata', landingController.getRestData)
router.post('/booking', landingController.saveBooking) //savebooking old
router.put('/booking/:id', landingController.updateBooking) // Edit booking
router.post('/getlangingpagedata', landingController.getLandingPageData);
// router.post('/blogs', landingController.blogs);
router.post('/blogs/featured', landingController.featuedBlog);
router.get('/getblogs', getBlogs);
router.post('/registerSubscriber', landingController.registerSubscriber);
router.post ('/restaurants', landingController.restaurants)
router.post ('/contact', landingController.contact)
// router.get("/testemail",getBlogs)

module.exports = router;