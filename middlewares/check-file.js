// check-file.js

const multer = require("multer");

// Configuración del almacenamiento de archivos
const multerFileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./uploads");
  },
  filename: (req, file, callback) => {
    callback(
      null,
      new Date().toISOString().replace(/:/g, "-").replace(".", "-") +
        "-" +
        file.originalname
    );
  },
});

// Filtro para imágenes
const imageFileFilter = (req, file, callback) => {
  const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"];
  callback(null, allowedMimeTypes.includes(file.mimetype));
};

// Filtro para cualquier tipo de archivo
const anyFileFilter = (req, file, callback) => {
  callback(null, true); // Permitir cualquier tipo de archivo
};

// Middleware para subir imágenes
const imgFileUploader = multer({
  storage: multerFileStorage,
  fileFilter: imageFileFilter,
});

// Middleware para subir cualquier archivo
const anyFileUploader = multer({
  storage: multerFileStorage,
  fileFilter: anyFileFilter,
});

// Exportar ambos middleware según el caso de uso
module.exports = {
  imgFileUploader,
  anyFileUploader,
};
