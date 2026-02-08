const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlockSchema = new Schema(
  {
    name: { type: String, required: true },
    template: {
      type: Schema.Types.ObjectId,
      ref: "BlockTemplate",
      required: true,
    },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    // Dynamic configuration based on the template (title, limits, category IDs, etc.)
    config: { type: Schema.Types.Mixed, default: {} },
    content: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

// Transform _id to id for frontend compatibility
BlockSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

const Block = mongoose.models.Block || mongoose.model("Block", BlockSchema);

module.exports = Block;
