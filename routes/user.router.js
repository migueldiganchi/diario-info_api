const express = require("express");
const userController = require("./../controllers/user.controller");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

router.get("/users", [], userController.getUsers);

router.get("/user/:id", [], userController.getUser);
router.get("/user/:id/publications", userController.getUserPublications);

router.post(
  "/user/:id/qualifications",
  checkAuth,
  userController.createUserQualification
);
router.put(
  "/user/:id/qualification",
  checkAuth,
  userController.updateUserQualification
);
router.get(
  "/user/:id/my-qualification",
  checkAuth,
  userController.getUserQualification
);

module.exports = router;
