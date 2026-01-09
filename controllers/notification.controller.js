const NotificationModel = require("../models/notification.model");

exports.getNotifications = async (req, res) => {
  try {
    const authUserId = req.userId;

    const {
      page = 1,
      pageSize = 10,
      term = "",
      source = "app",
      kind = "",
      status,
      isArchived,
    } = req.query;

    const { notifications, nextPage, totalNotifications } =
      await NotificationModel.getNotificationList(
        authUserId,
        parseInt(page),
        parseInt(pageSize),
        term,
        source,
        kind,
        status,
        isArchived
      );

    res.status(200).json({
      success: true,
      notifications: notifications,
      pagination: {
        total: totalNotifications,
        currentPage: parseInt(page),
        pageSize: parseInt(pageSize),
        nextPage,
      },
    });
  } catch (err) {
    console.error("[err]", err.message);
    res.status(500).json({
      message: "Something went wrong while getting notifications",
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id: notificationId } = req.params;

    await NotificationModel.deleteNotification(notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    console.error("[err]", err.message);
    res.status(500).json({
      message: "Something went wrong while deleting the notification",
    });
  }
};

exports.toggleReadingStatus = async (req, res) => {
  try {
    const { id: notificationId } = req.params;

    const notification = await NotificationModel.getNotification(
      notificationId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const updatedNotification = await NotificationModel.toggleReadingStatus(
      notificationId,
      notification.readAt == null
    );

    res.status(200).json({
      success: true,
      message: "Notification reading status toggled successfully",
      notification: updatedNotification,
    });
  } catch (err) {
    console.error("[err]", err.message);
    res.status(500).json({
      message:
        "Something went wrong while toggling the notification reading status",
    });
  }
};
