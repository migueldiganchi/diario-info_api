const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const qualificationSchema = new Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // The user who performs the rating is required
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // If rating a publication, this field can be null
  },
  toPublication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Publication",
    default: null, // If rating a user, this field can be null
  },
  rating: {
    type: Number,
    required: true,
    min: 1, // Define the minimum allowed rating value
    max: 5, // Define the maximum allowed rating value
  },
  comment: {
    type: String,
    default: "", // A comment is optional, so it has an empty default value
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null, // The updatedAt field is updated when the rating is edited
  },
  disabledAt: {
    type: Date,
    default: null, // If you want to disable a rating, you can use this field
  },
});

let qualificationModel = null;

try {
  qualificationModel = mongoose.model("Qualification");
} catch (error) {
  qualificationModel = mongoose.model("Qualification", qualificationSchema);
}

module.exports = qualificationModel;
