const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const notificationController = require("../controllers/notification.controller");

// Retrieve all Notifications for the authenticated user
router.get(
  "/notifications",
  checkAuth,
  notificationController.getNotifications,
);

// Toggle reading status of a specific Notification
router.put(
  "/notification/:id",
  checkAuth,
  notificationController.toggleReadingStatus,
);

// Delete a specific Notification
router.delete(
  "/notification/:id",
  checkAuth,
  notificationController.deleteNotification,
);

module.exports = router;
