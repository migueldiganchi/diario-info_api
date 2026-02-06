const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const articles = require("../controllers/article.controller.js");

// Create a new Article
router.post("/articles", checkAuth, articles.createArticle);

// Retrieve all Articles (for admin) or user's own articles
router.get("/articles", checkAuth, articles.getArticles);

// Retrieve all public Articles, sorted by priority
router.get("/articles/public", [], articles.getPublicArticles);

// Retrieve a single Article with id
router.get("/article/:id", [], articles.getArticle);

// Update an Article with id
router.put("/article/:id", checkAuth, articles.updateArticle);

// Delete an Article with id
router.delete("/article/:id", checkAuth, articles.deleteArticle);

module.exports = router;
