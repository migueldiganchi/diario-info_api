const express = require("express");
const paymentController = require("../controllers/payment.controller");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

router.post("/pay", checkAuth, paymentController.pay);
router.post("/payment", checkAuth, paymentController.save);
router.post("/payment/news", checkAuth, paymentController.handleNotification);

module.exports = router;
