const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const userController = require("./../controllers/user.controller");

router.get("/users", [], userController.getUsers);

router.post("/users", checkAuth, userController.createUser);

router.put("/user/:id", checkAuth, userController.updateUser);

router.put("/user/:id/status", checkAuth, userController.toggleUserStatus);

router.delete("/user/:id", checkAuth, userController.removeUser);

router.delete("/users", checkAuth, userController.removeUsers);

module.exports = router;
