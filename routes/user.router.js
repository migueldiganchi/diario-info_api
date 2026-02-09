const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const userController = require("./../controllers/user.controller");

// Retrieve all Users
router.get("/users", checkAuth, userController.getUsers);

// Create a new User (Admin)
router.post("/users", checkAuth, userController.createUser);

// Retrieve a single User with id
router.get("/user/:id", [], userController.getUser);

// Update a User with id
router.put("/user/:id", checkAuth, userController.updateUser);

// Update a User's status (Admin)
router.patch("/user/:id/status", checkAuth, userController.updateUserStatus);

// Delete a User (Admin)
router.delete("/user/:id", checkAuth, userController.deleteUser);

// Retrieve a user's articles
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
