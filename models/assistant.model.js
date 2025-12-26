const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const assistantSchema = new Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  picture: {
    _id: false,
    url: String,
    lazyUrl: String,
  },
  files: [
    {
      _id: false,
      url: String,
      lazyUrl: String,
    },
  ],

  // AI Training
  intents: [
    {
      _id: false,
      title: String,
      questions: [String],
      answers: [String],
    },
  ],

  // Company Data
  companyName: { type: String },
  companyEmail: { type: String, default: null },
  companyDescription: { type: String, default: null },
  companyLogoMedia: {
    _id: false,
    url: String,
    lazyUrl: String,
  },
  companyCoverMedia: {
    _id: false,
    url: String,
    lazyUrl: String,
  },

  // Location
  locationLatitude: { type: Number, default: null },
  locationLongitude: { type: Number, default: null },
  locationAddress: { type: String, default: null },

  // Base
  updatedAt: { type: Date, default: null },
  removedAt: { type: Date, default: null },
  createdAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: null },
});

let assistantModel = null;

try {
  assistantModel = mongoose.model("Assistant");
} catch (error) {
  assistantModel = mongoose.model("Assistant", assistantSchema);
}

module.exports = assistantModel;
