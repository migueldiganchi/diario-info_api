const express = require("express");
const botController = require("../controllers/bot.controller");
const router = express.Router();
const checkAuthBot = require("../middleware/check-auth-bot");

router.post("/io", checkAuthBot, botController.io);

module.exports = router;
