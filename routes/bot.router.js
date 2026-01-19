const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const botController = require("../controllers/bot.controller");

// Ruta para interactuar con el bot
router.post("/bot/io", checkAuth, botController.io);

module.exports = router;