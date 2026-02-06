const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlockTemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // e.g., 'hero-slider', 'grid-3'
    description: { type: String },
    icon: { type: String },
    previewUrl: { type: String },
    schema: { type: Schema.Types.Mixed }, // JSON schema for frontend configuration validation
  },
  { timestamps: true },
);

// Transform _id to id for frontend compatibility
BlockTemplateSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

const BlockTemplate =
  mongoose.models.BlockTemplate ||
  mongoose.model("BlockTemplate", BlockTemplateSchema);

module.exports = BlockTemplate;
