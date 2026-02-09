const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const fileController = require("../controllers/file.controller");
const { imgFileUploader } = require("../middlewares/check-file");

// Retrieve all Files
router.get("/files", checkAuth, fileController.getFiles);

// Upload a new File
router.post(
  "/files/upload",
  checkAuth,
  imgFileUploader.single("file"),
  fileController.uploadFile,
);

// Retrieve a single File with id
router.get("/file/:id", [], fileController.getFileById);

// Update a File with id (description)
router.put("/file/:id", checkAuth, fileController.updateFile);

// Delete a File
router.delete("/file/:id", checkAuth, fileController.deleteFile);

module.exports = router;
