const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const notificationController = require("../controllers/notification.controller");

router.get(
  "/notifications",
  checkAuth,
  notificationController.getNotifications
);

router.put(
  "/notification/:id",
  checkAuth,
  notificationController.toggleReadingStatus
);

router.delete(
  "/notification/:id",
  checkAuth,
  notificationController.deleteNotification
);

module.exports = router;
