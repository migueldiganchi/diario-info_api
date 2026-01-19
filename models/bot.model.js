const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const botSchema = new Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },

  categoryKey: { type: String, default: null },
  alias: { type: String, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  instructions: { type: String },
  price: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  pictureUrl: { type: String },
  coverUrl: { type: String },
  companyName: { type: String },
  companyEmail: { type: String, default: null },
  companyDescription: { type: String, default: null },
  companyLogoUrl: { type: String },
  companyCoverUrl: { type: String },
  locationLatitude: { type: Number, default: null },
  locationLongitude: { type: Number, default: null },
  locationAddress: { type: String, default: null },
  locationCity: { type: String, default: null },
  locationProvince: { type: String, default: null },
  locationCountry: { type: String, default: null },
  status: { type: String, default: null },

  tags: [String],

  // Bot Files
  files: [
    {
      _id: false,
      url: String,
      lazyUrl: String,
    },
  ],

  // Intents to handle user queries
  intents: [
    {
      _id: false, // Disable ID generation
      name: { type: String, required: true },
      description: { type: String },
      questions: [{ type: String }],
      answers: [{ type: String }],
      intention: { type: String },
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true },

      intentionFiles: [
        {
          _id: false,
          url: String,
          lazyUrl: String,
        },
      ],
    },
  ],

  // Fields to collect from user
  fields: [
    {
      _id: false, // Disable ID generation
      name: { type: String, required: true }, // ej: "email", "phone", "fullname"
      label: { type: String, required: true }, // ej: "Email Address", "Phone Number", "Nombre Completo"
      type: {
        type: String,
        enum: ["text", "email", "phone", "number", "date", "select"],
        default: "text",
      },
      required: { type: Boolean, default: false },
      placeholder: { type: String }, // ej: "Enter your Email"
      validation: { type: String }, // Validation Regex
      options: [{ type: String }], // To 'select' type
      collectAt: {
        type: String,
        enum: ["start", "end", "any", "specific"],
        default: "any",
      },
      collectOnIntent: { type: String }, // Intent in case correspond
      order: { type: Number, default: 0 }, // Order
      active: { type: Boolean, default: true },
    },
  ],

  // Notifications
  notificationOn: { type: Boolean, default: false },
  notificationEmails: [{ type: String }],

  // Timestamps
  updatedAt: { type: Date, default: null },
  removedAt: { type: Date, default: null },
  createdAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

let botModel = null;

try {
  botModel = mongoose.model("Bot");
} catch (error) {
  botModel = mongoose.model("Bot", botSchema);
}

module.exports = botModel;
