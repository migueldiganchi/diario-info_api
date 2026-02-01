const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String },
  alias: { type: String, unique: true },
  description: { type: String },
  coverUrl: { type: String },
  pictureUrl: { type: String },
  phone: { type: String },
  locationAddress: { type: String },
  locationLatitude: { type: Number, default: null },
  locationLongitude: { type: Number, default: null },
  locationCountry: { type: String },
  locationProvince: { type: String },
  locationCity: { type: String },
  locationZip: { type: String },
  trackingKey: { type: String },
  paymentDetails: { type: String },
  role: {
    type: String,
    enum: ["Reader", "Editor", "Admin"],
    default: "Reader",
    required: true,
  },
  createdAt: { type: Date, default: null },
  updatedAt: { type: Date, default: null },
  disabledAt: { type: Date, default: null },
  signupToken: { type: String, default: null },
  signupTokenExpiresAt: { type: Date, default: null },
  signupTokenActivatedAt: { type: Date, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
  instagramUser: { type: String },
  isSuperUser: { type: Boolean, default: false },
  isLandingUser: { type: Boolean, default: false },
  status: { type: Number, default: 0 },
});

// Middleware to update updatedAt
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if user has a specific role
userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

// Method to check if user is Admin
userSchema.methods.isAdmin = function () {
  return this.role === "Admin" || this.isSuperUser === true;
};

// MMethod to check if user can edit
userSchema.methods.canEdit = function () {
  return this.role === "Admin" || this.role === "Editor";
};

userSchema.index({
  name: "text",
  bio: "text",
  description: "text",
  locationCity: "text",
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
