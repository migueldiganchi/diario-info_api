const express = require("express");
const authController = require("./../controllers/auth.controller");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

router.post("/signup", [], authController.signup);
router.post("/signup/:token/activation", [], authController.activateAccount);
router.post("/signin", [], authController.signin);
router.delete("/signout", checkAuth, authController.signout);
router.get("/me", checkAuth, authController.me);
router.put("/me", checkAuth, authController.updateAuthUser);
router.post("/reset", [], authController.reset);
router.get("/reset/:token", [], authController.validatePasswordReset);
router.put("/reset/:token/password", [], authController.createPassword);

module.exports = router;
