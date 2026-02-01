const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const userController = require("./../controllers/user.controller");

// Retrieve all Users
router.get("/users", [], userController.getUsers);

// Create a new User (Admin)
router.post("/users", checkAuth, userController.createUser);

// Retrieve a single User with id
router.get("/user/:id", [], userController.getUser);

// Update a User with id
router.get("/user/:id/articles", [], userController.getUserArticles);

// User Qualifications
router.post(
  "/user/qualification",
  checkAuth,
  userController.createUserQualification,
);

// Update a User Qualification
router.put(
  "/user/:id/qualification",
  checkAuth,
  userController.updateUserQualification,
);

// Get a User Qualification
router.get(
  "/user/:id/qualification",
  checkAuth,
  userController.getUserQualification,
);

module.exports = router;
