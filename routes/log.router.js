const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth.js");
const logController = require("../controllers/log.controller");

// You'll probably want to add authentication and authorization middlewares here.
// const { isAuthenticated, isAdmin } = require("../middlewares/auth.middleware");

// GET /logs -> Get all logs with filtering and pagination.
// This should be a protected route for administrators only.
router.get("/logs", checkAuth, logController.getLogs);

module.exports = router;
