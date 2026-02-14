const File = require("../models/file.model.js");
const path = require("path");
const fs = require("fs").promises;
let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  console.warn(
    "⚠️ Sharp library not found. Thumbnail generation and image dimension extraction will be disabled. To enable these features, install sharp with: npm install sharp",
  );
}

// Generate thumbnail for image files using Sharp. If Sharp is not available, skip this step.
const generateThumbnail = async (filePath, thumbnailPath) => {
  if (!sharp) return false;
  try {
    await sharp(filePath)
      .resize(400, 400, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFile(thumbnailPath);
    return true;
  } catch (error) {
    console.error("[Error generating thumbnail]", error);
    return false;
  }
};

// Get image dimensions using Sharp. If Sharp is not available or an error occurs, return null for both width and height.
const getImageDimensions = async (filePath) => {
  if (!sharp) return { width: null, height: null };
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    return { width: null, height: null };
  }
};

// GET /api/files - Get paginated list of files with optional search
exports.getFiles = async (req, res) => {
  try {
    const { page = 1, limit = 24, search } = req.query;

    const query = {};

    // Text search on originalName and description fields
    if (search && search.trim()) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("uploadedBy", "name email");

    const total = await File.countDocuments(query);

    return res.status(200).json({
      status: true,
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      status: false,
      message: "Error al obtener archivos",
    });
  }
};

// GET /api/file/:id - Get file details by ID
exports.getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id).populate("uploadedBy", "name email");

    if (!file) {
      return res.status(404).json({
        status: false,
        message: "Archivo no encontrado",
      });
    }

    return res.status(200).json({
      status: true,
      file,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      status: false,
      message: "Error al obtener archivo",
    });
  }
};

// POST /api/files/upload - Upload a new file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No se proporcionó archivo",
      });
    }

    const { description } = req.body;
    const userId = req.userId;

    const filePath = req.file.path;
    const fileUrl = `/uploads/${req.file.filename}`;

    // Generar thumbnail
    const thumbnailFilename = `thumb_${req.file.filename}`;
    const thumbnailPath = path.join(path.dirname(filePath), thumbnailFilename);

    const thumbCreated = await generateThumbnail(filePath, thumbnailPath);
    const thumbnailUrl = thumbCreated ? `/uploads/${thumbnailFilename}` : null;

    // Obtener dimensiones
    const dimensions = await getImageDimensions(filePath);

    // Crear registro en DB
    const file = new File({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl,
      thumbnailUrl,
      description: description || "",
      mimeType: req.file.mimetype,
      size: req.file.size,
      width: dimensions.width,
      height: dimensions.height,
      uploadedBy: userId,
    });

    await file.save();

    return res.status(201).json({
      status: true,
      message: "Archivo subido correctamente",
      file,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      status: false,
      message: "Error al subir archivo",
    });
  }
};

// PUT /api/file/:id - Update file metadata (e.g., description)
exports.updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const file = await File.findByIdAndUpdate(
      id,
      { description },
      { new: true },
    );

    if (!file) {
      return res.status(404).json({
        status: false,
        message: "Archivo no encontrado",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Archivo actualizado correctamente",
      file,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      status: false,
      message: "Error al actualizar archivo",
    });
  }
};

// DELETE /api/file/:id - Remove a file by ID (delete physical file and DB record)
exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({
        status: false,
        message: "Archivo no encontrado",
      });
    }

    // Remove physical files
    const filePath = path.join(__dirname, "../../", file.fileUrl);
    const thumbnailPath = file.thumbnailUrl
      ? path.join(__dirname, "../../", file.thumbnailUrl)
      : null;

    try {
      await fs.unlink(filePath);
      if (thumbnailPath) {
        await fs.unlink(thumbnailPath);
      }
    } catch (unlinkErr) {
      console.error("[Error deleting physical files]", unlinkErr);
    }

    // Remove DB record
    await File.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "Archivo eliminado correctamente",
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      status: false,
      message: "Error al eliminar archivo",
    });
  }
};
