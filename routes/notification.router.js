const express = require("express");
const notificationController = require("../controllers/notification.controller");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

router.get(
  "/notifications",
  checkAuth,
  notificationController.getNotifications
);

router.put("/notification/:id", checkAuth, notificationController.toggleReading);

router.delete(
  "/notification/:id",
  checkAuth,
  notificationController.removeNotification
);

module.exports = router;
