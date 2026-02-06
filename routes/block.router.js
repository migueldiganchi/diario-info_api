const express = require("express");
const router = express.Router();
const blocks = require("../controllers/block.controller.js");
// const checkAuth = require('../middleware/check-auth');

// Retrieve all Block Templates
router.get("/block-templates", blocks.getTemplates);

// Retrieve all Blocks
router.get("/blocks", blocks.getBlocks);

// Create a new Block
router.post("/blocks", blocks.createBlock);

// Update a Block with id
router.put("/block/:id", blocks.updateBlock);

// Delete a Block with id
router.delete("/block/:id", blocks.deleteBlock);

// Reorder Blocks
router.post("/blocks/reorder", blocks.reorderBlocks);

module.exports = router;
