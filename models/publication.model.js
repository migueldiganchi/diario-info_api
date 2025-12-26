const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const publicationSchema = new Schema({
  categoryName: { type: String },
  categories: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  assistant: { type: mongoose.Schema.Types.ObjectId, ref: "Assistant" },
  typed: { type: String },
  kind: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  labels: [String],

  calendarAt: { type: Date, default: null },
  updatedAt: { type: Date, default: null },
  disabledAt: { type: Date, default: null },
  createdAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  status: { type: String },
  price: { type: Number },
  stock: { type: Number },

  locationLatitude: { type: Number, default: null },
  locationLongitude: { type: Number, default: null },
  locationAddress: { type: String, default: null },
  locationUrl: { type: String, default: null },

  measureUnit: { type: String, default: null },
  measureQuantity: { type: Number, default: null },

  discount: { type: Number },
  discountType: { type: String },
  discountCode: { type: String },
  discountAmount: { type: Number },
  discountLocationLat: { type: Number },
  discountLocationLng: { type: Number },
  discountMaxCopies: { type: Number },
  discountStartsAt: { type: Date, default: null },
  discountEndsAt: { type: Date, default: null },

  files: [
    {
      _id: false,
      url: String,
      lazyUrl: String,
    },
  ],
});

publicationSchema.index({
  title: "text",
  description: "text",
  locationAddress: "text",
});

let publicationModel = null;

try {
  publicationModel = mongoose.model("Publication");
} catch (error) {
  publicationModel = mongoose.model("Publication", publicationSchema);
}

module.exports = publicationModel;
