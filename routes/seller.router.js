const express = require("express");
const sellerController = require("../controllers/seller.controller");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

router.post(
  "/seller/credentials",
  checkAuth,
  sellerController.createSellerCredentials
);
router.put(
  "/seller/credentials",
  checkAuth,
  sellerController.updateSellerCredentials
);
router.delete(
  "/seller/credentials",
  checkAuth,
  sellerController.removeSellerCredentials
);

module.exports = router;
