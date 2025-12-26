const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sellerSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  marketplaceAccessToken: { type: String, default: null },
  marketplaceTokenType: { type: String, default: null },
  marketplaceExpiresAt: { type: Date, default: null },
  marketplaceScope: { type: String, default: null },
  marketplaceUserId: { type: String, default: null },
  marketplaceRefreshToken: { type: String, default: null },
  marketplacePublicKey: { type: String, default: null },
  marketplaceLiveMode: { type: Boolean, default: false },
  createdAt: { type: Date, default: null },
});

let sellerModel = null;

try {
  sellerModel = mongoose.model("Seller");
} catch (error) {
  sellerModel = mongoose.model("Seller", sellerSchema);
}

module.exports = sellerModel;
