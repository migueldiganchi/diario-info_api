const express = require("express");
const router = express.Router();
const publicationController = require("../controllers/publication.controller");
const checkAuth = require("../middleware/check-auth");

// GET /publications
router.get("/publications", publicationController.getPublications);

// GET /publications/mine
router.get(
  "/my-publications",
  checkAuth,
  publicationController.getPublicationsByOwner
);

// GET /publications/:id
router.get("/publication/:id", publicationController.getPublication);

// POST /publication
router.post(
  "/publications",
  checkAuth,
  publicationController.createPublication
);

// PUT /publication/:id
router.put(
  "/publication/:id",
  checkAuth,
  publicationController.updatePublication
);

// DELETE /publication/:id
router.delete(
  "/publication/:id",
  checkAuth,
  publicationController.removePublication
);

module.exports = router;
