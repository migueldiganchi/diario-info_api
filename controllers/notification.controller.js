const Notification = require("../models/notification.model.js");

// Notifications
exports.getNotifications = async (req, res) => {
  const authenticatedUserId = req.userId;
  const page = Math.max(0, req.query.page);
  const pageSize = Math.max(0, req.query.pageSize);
  const queryConditions = {
    toUser: authenticatedUserId,
  };

  try {
    const notifications = await Notification.find(queryConditions)
      .populate("fromUser", "_id name email pictureUrl")
      .populate("toUser", "_id name email pictureUrl")
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
    const total = await Notification.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    return res.status(200).json({
      success: true,
      notifications,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message: err.message || "Something went wrong while get notifications",
    });
  }
};

// Mark as read
exports.toggleReading = async (req, res) => {
  const notificationId = req.params.id;

  try {
    const notification = await Notification.findById(notificationId);
    notification.readAt = notification.readAt ? null : Date.now();
    notification.save();

    return res.status(201).json({
      success: true,
      notification,
      message: `Notification was marked as ${
        notification.readAt ? "Read" : "Unread"
      }`,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while update notification reading",
    });
  }
};

// Remove Notifications
exports.removeNotification = async (req, res) => {
  const notificationId = req.params.id;

  try {
    const removedNotification = await Notification.findByIdAndRemove(
      notificationId
    );
    res.status(200).json({
      success: true,
      message: "Notification removed successfully",
      removedNotification: removedNotification,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while removing the Notification.",
    });
  }
};
