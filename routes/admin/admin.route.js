const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/admin/dashboard.controller");
const userController = require("../../controllers/admin/users.controller");
const settingController = require("../../controllers/admin/setting.controller");
const createMeta = require('../../controllers/admin/meta.controller')
const UpdateMeta = require('../../controllers/admin/meta.controller')
const getMetadata = require('../../controllers/admin/meta.controller')
const DeleteMetadata = require('../../controllers/admin/meta.controller')
const {createAccesslist,updateAccesslist,deleteAccesslist,getAccesslist, getAccesslistById} = require('../../controllers/admin/accesslist.controller')
const {deletePackage,updatePackage,getPackages,createPackage,getPackage} = require('../../controllers/admin/subscriptionPackage.controller')

const multer = require("multer");
// const Authorized = require("../.././middlewares/jwtVerify")
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "media/uploads/");
//   },
//   filename: function (req, file, cb) {
//     let ext = ""; // set default extension (if any)
//     if (file.originalname.split(".").length > 1)
//       // checking if there is an extension or not.
//       ext = file.originalname.substring(
//         file.originalname.lastIndexOf("."),
//         file.originalname.length
//       );
//     cb(null, Date.now() + ext);
//   },
// });
// var upload = multer({ storage: storage });
// upload.fields([{ name: "thumbnail" }, { name: "cover_image" }])
router.post('/accessList',createAccesslist)
router.put('/accessList',updateAccesslist)
router.delete('/accessList',deleteAccesslist)
router.get('/accessLists',getAccesslist)
router.get('/accessList',getAccesslistById)
router.post("/getDashboardData", dashboardController.getDashboardData);
router.get("/package", getPackage);
router.get("/packages", getPackages);
router.put("/package", updatePackage);
router.post('/package',createPackage)
router.delete("/package", deletePackage);
router.post("/meta", createMeta.createMetaData);
router.put("/meta/:id", UpdateMeta.updateMeta);
router.get("/meta", getMetadata.getMetaData);
router.delete("/meta/:id", DeleteMetadata.DeleteMetadata);
router.post("/restaurants",dashboardController.getAllRests);
router.delete("/restaurant/:id", dashboardController.deleteRest);
router.post("/getrestdetail", dashboardController.getRestDetail);
router.post("/restaurant", dashboardController.updateRest);
router.put("/updateBlogById/:id", dashboardController.updateBlog);
router.delete("/blog/:id", dashboardController.deleteBlogById);
// router.post("/getblogsbyuserid", dashboardController.getblogsbyuserid);
router.post(
  "/blog",
  dashboardController.createBlog
);
router.post("/getalltransactions", dashboardController.getAllTransactions);

router.post("/getsettingdata", dashboardController.getSettingData);
router.post("/updatesettingdata", dashboardController.updateSettingData);

router.post("/getSubscribers", userController.getSubscribers);

router.post("/getcuisinecategory", settingController.getCuisineCategory);
router.post("/addcuisinecategory", settingController.addCuisineCategory);
router.post("/updatecuisinecategory", settingController.updateCuisineCategory);
router.post("/deletecuisinecategory", settingController.deleteCuisineCategory);
router.post(
  "/restorecuisinecategory",
  settingController.restoreCuisineCategory
);

module.exports = router;
