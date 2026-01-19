const mongoose = require("mongoose");
const { Schema } = mongoose;

// Corresponde a la definición de Article
const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    contentBlocks: [
      {
        // El orden visual se determina por la posición (índice) en este array
        type: {
          type: String,
          enum: ["text", "image", "video"],
          required: true,
        },
        value: { type: String, required: true },
        _id: false,
      },
    ],
    imageId: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "review"],
      default: "draft",
    },
    isHighlighted: { type: Boolean, default: false },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    articleDate: { type: Date, default: Date.now },
    commentsDisabled: { type: Boolean, default: false },
    priority: {
      type: String,
      required: true,
      enum: ["Baja", "Media", "Alta", "Muy Alta"],
      default: "Media",
    },
    destination: {
      type: String,
      required: true,
      enum: ["general", "analisis", "especial", "ultimomomento", "tuaiyu"],
      default: "general",
    },
    validityHours: { type: Number, default: 6 },
    tags: { type: [String], index: true },
    articleType: { type: String, default: "General" },
  },
  {
    timestamps: true, // Esto añade createdAt y updatedAt automáticamente
  },
);

// Índices para optimizar las consultas más comunes
ArticleSchema.index({ status: 1, articleDate: -1 });
ArticleSchema.index({ category: 1, status: 1 });

// Evita que Mongoose compile el modelo más de una vez
const Article =
  mongoose.models.Article || mongoose.model("Article", ArticleSchema);

module.exports = Article;
