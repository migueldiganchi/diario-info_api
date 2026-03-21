const mongoose = require("mongoose");
const { Schema } = mongoose;

const PlaylistItemSchema = new Schema({
  url: { type: String, required: true },
  description: { type: String },
  platform: {
    type: String,
    enum: ["youtube", "instagram", "tiktok", "facebook", "twitch", "other"],
    default: "other",
  },
  thumbnailUrl: { type: String }, // Optional, in case scraping is implemented in the future
  isVisible: { type: Boolean, default: true },
  addedAt: { type: Date, default: Date.now },
});

const PlaylistSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, unique: true, trim: true },
    items: [PlaylistItemSchema],
    isVisible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Helper to detect platform based on URL
PlaylistSchema.methods.detectPlatform = function (url) {
  if (!url) return "other";
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be"))
    return "youtube";
  if (lowerUrl.includes("instagram.com")) return "instagram";
  if (lowerUrl.includes("tiktok.com")) return "tiktok";
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.watch"))
    return "facebook";
  if (lowerUrl.includes("twitch.tv")) return "twitch";
  return "other";
};

// Pre-save hook to assign platform to new or modified items
PlaylistSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    this.items.forEach((item) => {
      if (!item.platform || item.platform === "other") {
        item.platform = this.detectPlatform(item.url);
      }
    });
  }
  next();
});

const Playlist =
  mongoose.models.Playlist || mongoose.model("Playlist", PlaylistSchema);

module.exports = Playlist;