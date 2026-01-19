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

let categoryModel = null;

try {
  categoryModel = mongoose.model("Category");
} catch (error) {
  categoryModel = mongoose.model("Category", categorySchema);
}

module.exports = categoryModel;
