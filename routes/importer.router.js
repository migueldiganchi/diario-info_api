const express = require("express");
const router = express.Router();
const importerController = require("../controllers/importer.controller");
const checkAuth = require("../middlewares/check-auth");

// Importar una noticia específica por su ID de MySQL
// POST /api/import/article/12345
router.post(
  "/import/article/:id",
  checkAuth,
  importerController.importArticleById,
);

module.exports = router;
