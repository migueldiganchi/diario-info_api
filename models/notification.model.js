const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publication: { type: mongoose.Schema.Types.ObjectId, ref: "Publication" },
  kind: { type: String, default: null },
  title: { type: String, default: null },
  message: { type: String, default: null },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: null },
});

let notificationModel = null;

try {
  notificationModel = mongoose.model("Notification");
} catch (error) {
  notificationModel = mongoose.model("Notification", notificationSchema);
}

module.exports = notificationModel;
