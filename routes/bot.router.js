const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const botController = require("../controllers/bot.controller");

// Interact with the bot
router.post("/bot/io", checkAuth, botController.io);

module.exports = router;
