const Notification = require("../models/notification.model.js");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error retrieving notifications.",
    });
  }
};

exports.toggleReadingStatus = async (req, res) => {
  const id = req.params.id;
  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.read = !notification.read;
    await notification.save();
    res.status(200).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error updating notification.",
    });
  }
};

exports.deleteNotification = async (req, res) => {
  const id = req.params.id;
  try {
    await Notification.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error deleting notification.",
    });
  }
};
