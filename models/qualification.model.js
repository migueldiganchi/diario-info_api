const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const qualificationSchema = new Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toBot: { type: mongoose.Schema.Types.ObjectId, ref: "Bot" },
  rating: { type: Number, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: null },
  updatedAt: { type: Date, default: null },
  disabledAt: { type: Date, default: null },
});

let qualificationModel = null;

try {
  qualificationModel = mongoose.model("Qualification");
} catch (error) {
  qualificationModel = mongoose.model("Qualification", qualificationSchema);
}

module.exports = qualificationModel;
