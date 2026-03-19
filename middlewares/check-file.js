const multer = require("multer");
// Setup for file storage
const multerFileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./uploads");
  },
  filename: (req, file, callback) => {
    callback(
      null,
      new Date().toISOString().replace(/:/g, "-").replace(".", "-") +
        "-" +
        file.originalname,
    );
  },
});

// Images allowed: PNG, JPG, JPEG
const imageFileFilter = (req, file, callback) => {
  const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"];
  callback(null, allowedMimeTypes.includes(file.mimetype));
};

// Any file allowed: no restrictions
const anyFileFilter = (req, file, callback) => {
  callback(null, true); // Permitir cualquier tipo de archivo
};

// Middleware to upload images only (PNG, JPG, JPEG)
const imgFileUploader = multer({
  storage: multerFileStorage,
  fileFilter: imageFileFilter,
});

// Middleware to upload any file (no restrictions)
const anyFileUploader = multer({
  storage: multerFileStorage,
  fileFilter: anyFileFilter,
});

// Export both middlewares according to the use case
module.exports = {
  imgFileUploader,
  anyFileUploader,
};
