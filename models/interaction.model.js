const mongoose = require("mongoose");
const { Schema } = mongoose;

const InteractionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true },
    interactionType: {
      type: String,
      enum: ["favorite", "like", "save"],
      default: "favorite",
    },
  },
  {
    timestamps: true,
  },
);

// Índice único para evitar duplicados del mismo tipo por usuario
InteractionSchema.index(
  { user: 1, article: 1, interactionType: 1 },
  { unique: true },
);
// Índice para búsquedas rápidas por artículo (contadores)
InteractionSchema.index({ article: 1, interactionType: 1 });

const Interaction =
  mongoose.models.Interaction ||
  mongoose.model("Interaction", InteractionSchema);

module.exports = Interaction;
