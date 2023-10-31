const express = require("express");
const authRoutes = require("./auth.route");
const profileRoutes = require("./profile.route");
const bookingRoutes = require("./booking.route");
const {
  subscription,
  stripePaymentWebhooks,
  getStripeSubscription,
  stripeDeleteSubscription,
  gettransactionhistory,
  getbookingHistory,
  chargeCommsion,
  createSubPackages,
  updateSubPackage,
  deleteSubPackage,
  getSubPackages
} = require("../../controllers/creator/payment.controller");
const {optsend,emailverification} = require("../../_helpers/emailverification.controller");
const {
  getActivityLog,
  getActivitySearch,
} = require("../../controllers/creator/getActivityLog");
const router = express.Router();

router.use("/auth/", authRoutes);
router.use("/profile/", profileRoutes);
router.get("/getActivityLog/", getActivityLog);
router.get("/getActivitySearch/", getActivitySearch);
router.use("/booking/", bookingRoutes);
router.post("/payment/stripe", subscription);
router.get("/getSingleSubscription/:id", getStripeSubscription);
router.get("/gettransactions", gettransactionhistory);
router.post("/chargeBookingCommision/:id", chargeCommsion);
router.get("/getbookingHistory/:id", getbookingHistory);
router.post("/otp/generate",optsend)
router.post("/otp/verify",emailverification)
router.post("/payment/stripe/webhook", stripePaymentWebhooks);
// router.post('/payment/gettransactionsbyrestid', paymentController.transactionData);

module.exports = router;
