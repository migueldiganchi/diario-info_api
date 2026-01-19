const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const userController = require("./../controllers/user.controller");

router.get("/users", [], userController.getUsers);
router.get("/user/:id", [], userController.getUser);
router.get("/user/:id/articles", [], userController.getUserArticles);
router.post(
  "/user/qualification",
  checkAuth,
  userController.createUserQualification,
);
router.put(
  "/user/:id/qualification",
  checkAuth,
  userController.updateUserQualification,
);
router.get(
  "/user/:id/qualification",
  checkAuth,
  userController.getUserQualification,
);

module.exports = router;
