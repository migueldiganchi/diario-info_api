const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    color: { type: String, default: "#cccccc" },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    disabledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// Transform _id to id for frontend compatibility
categorySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

module.exports = Category;
