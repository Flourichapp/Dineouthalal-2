const { profileEnd } = require('console');
const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/creator/profile.controller');

router.post('/getdashboarddata', profileController.getDashboardData);
router.post('/getsetting', profileController.getSetting);
router.post('/updatesetting', profileController. updateSetting);
router.post('/gettotalreviews', profileController.getTotalReviews);

// router.post('/uploadsettingimage', profileController.uploadSettingImage);
// router.post('/deletesettingimage', profileController.deleteSettingImage);
// router.post('/updatesettingimagestatus', profileController.updateSettingImageStatus);
// router.post('/getsettinginformationmetadata', profileController.getSettingInformationMetaData);
// router.post('/updatesettinginformation', profileController.updateSettingInformation);

router.post('/updatesettingaddress', profileController.updateSettingAddress);

router.post('/uploadsettingmenu', profileController.uploadSettingMenu);

router.post('/uploadthumbnail', profileController.uploadThumbnail);
router.post('/deletethumbnail', profileController.deleteThumbnail);

router.post('/uploadgallaryimg', profileController.uploadgallaryimg);
router.post('/uploadgalleries', profileController.uploadGallaries)
router.post('/deletegallaryimg', profileController.deleteGallaryImg);
router.post('/deletefullmenu', profileController.deleteFullMenu);
router.post('/updateoffermenu', profileController.updateOfferMenu);
router.post('/getrestseats', profileController.getRestSeats);
router.post('/updaterestseat', profileController.updateRestSeats);
router.post('/updatedatetimeinfo', profileController.updateDateTimeInfo);

router.post('/getrestinfobyuserid', profileController.getRestInfoByUserId);
router.post('/addnewrestaurant', profileController.addNewRest);
router.post('/update_admin_profile', profileController.updateProfile);


// restaurant menu
router.post('/getmenu', profileController.getMenu);
router.post('/addmenu', profileController.addMenu);
router.post('/updatemenu', profileController.updateMenu);
router.post('/deletemenu', profileController.deleteMenu);
router.put('/menu', profileController.uploadFile);
// routes
// router.post('/create', profileController.createProfile);
// router.post('/update', profileController.updateProfile);
// router.post('/uploadcard', profileController.uploadCard);
// router.post('/uploadavatar', profileController.uploadAvatar);
// router.post('/getme', profileController.getMe);
// router.post('/needapprove', profileController.needApprove);
// router.post('/verifycode', profileController.verifyCode);
// router.post('/getmediadata', profileController.getmediadata);
// router.post('/uploadportfolio', profileController.uploadPortfolio);
// router.post('/uploadstory', profileController.uploadStory);

module.exports = router;
