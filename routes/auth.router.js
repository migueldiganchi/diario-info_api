const express = require("express");
const authController = require("./../controllers/auth.controller");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

// User Signup
router.post("/signup", [], authController.signup);

// Account Activation
router.post("/signup/:token/activation", [], authController.activateAccount);

// User Signin
router.post("/signin", [], authController.signin);

// User Signout
router.delete("/signout", checkAuth, authController.signout);

// Get Authenticated User Info
router.get("/me", checkAuth, authController.me);

// Update Authenticated User Info
router.put("/me", checkAuth, authController.updateAuthUser);

// Password Reset Request
router.post("/reset", [], authController.reset);

// Validate Password Reset Token
router.get("/reset/:token", [], authController.validatePasswordReset);

// Create New Password
router.put("/reset/:token/password", [], authController.createPassword);

module.exports = router;
