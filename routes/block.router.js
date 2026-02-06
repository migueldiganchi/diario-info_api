const express = require("express");
const router = express.Router();
const blocks = require("../controllers/block.controller.js");
const checkAuth = require('../middleware/check-auth');

// Retrieve all Block Templates
router.get("/block-templates", blocks.getTemplates);

// Create a new Block Template
router.post("/block-templates", checkAuth, blocks.createTemplate);

// Update a Block Template with id
router.put("/block-template/:id", checkAuth, blocks.updateTemplate);

// Delete a Block Template with id
router.delete("/block-template/:id", checkAuth, blocks.deleteTemplate);

// Retrieve all Blocks
router.get("/blocks", blocks.getBlocks);

// Create a new Block
router.post("/blocks", checkAuth, blocks.createBlock);

// Update a Block with id
router.put("/block/:id", checkAuth, blocks.updateBlock);

// Delete a Block with id
router.delete("/block/:id", checkAuth, blocks.deleteBlock);

// Reorder Blocks
router.post("/blocks/reorder", checkAuth, blocks.reorderBlocks);

module.exports = router;
