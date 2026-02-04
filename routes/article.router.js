const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const articles = require("../controllers/article.controller.js");

// Create a new Article
router.post("/articles", checkAuth, articles.createArticle);

// Retrieve all Articles
router.get("/articles", checkAuth, articles.getArticles);

// Retrieve a single Article with id
router.get("/article/:id", [], articles.getArticle);

// Update an Article with id
router.put("/article/:id", checkAuth, articles.updateArticle);

// Delete an Article with id
router.delete("/article/:id", checkAuth, articles.deleteArticle);

module.exports = router;
