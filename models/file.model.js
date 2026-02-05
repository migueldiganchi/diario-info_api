const mongoose = require("mongoose");
const { Schema } = mongoose;

const FileSchema = new Schema(
  {
    fileName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    originalName: { 
      type: String, 
      required: true 
    },
    fileUrl: { 
      type: String, 
      required: true 
    },
    thumbnailUrl: { 
      type: String 
    },
    description: { 
      type: String, 
      trim: true,
      default: ""
    },
    mimeType: { 
      type: String, 
      required: true 
    },
    size: { 
      type: Number, 
      required: true 
    },
    width: { 
      type: Number 
    },
    height: { 
      type: Number 
    },
    uploadedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true,
      index: true
    },
    usageCount: { 
      type: Number, 
      default: 0 
    },
  },
  {
    timestamps: true,
  }
);

// Transform _id to id
FileSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

// Índice para búsqueda de texto
FileSchema.index({ 
  originalName: "text", 
  description: "text"
});

const File = mongoose.models.File || mongoose.model("File", FileSchema);

module.exports = File;