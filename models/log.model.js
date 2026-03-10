const mongoose = require("mongoose");
const { Schema } = mongoose;

const LogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    details: { type: String },
  },
  {
    timestamps: true,
  }
);

LogSchema.index({ user: 1, createdAt: -1 });
LogSchema.index({ action: 1, createdAt: -1 });

const Log = mongoose.models.Log || mongoose.model("Log", LogSchema);

module.exports = Log;