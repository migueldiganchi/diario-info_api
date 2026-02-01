const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: null },
  updatedAt: { type: Date, default: null },
  disabledAt: { type: Date, default: null },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
});

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

module.exports = Category;
