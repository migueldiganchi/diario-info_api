const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller.js");
const checkAuth = require("../middlewares/check-auth.js");

// Create a new Category
router.post("/categories", checkAuth, categoryController.createCategory);

// Retrieve all Categories
router.get("/categories", [], categoryController.getCategories);

// Retrieve a single Category with id or slug
router.get("/category/:id", [], categoryController.getCategory);

// Update a Category with id
router.put("/category/:id", checkAuth, categoryController.updateCategory);

// Delete a Category with id (soft delete)
router.delete("/category/:id", checkAuth, categoryController.deleteCategory);

module.exports = router;