const UserModel = require("../models/user.model");
const LogModel = require("../models/log.model");

const bcrypt = require("bcryptjs");

exports.createUser = async (req, res) => {
  const authenticatedUserId = req.userId;
  const {
    name,
    lastName,
    email,
    status,
    role,
    phone,
    locationAddress,
    locationLat,
    locationLng,
    details,
  } = req.body;

  try {
    const staticPassword = "Aluwind.10";
    const staticHashedPassword = await bcrypt.hash(staticPassword, 12);

    // Create User
    await UserModel.createUser({
      name,
      lastName,
      email,
      password: staticHashedPassword,
      status,
      role,
      phone,
      locationAddress,
      locationLat,
      locationLng,
      details,
    });

    // Create Log
    await LogModel.createLog({
      createdAt: new Date(),
      userId: authenticatedUserId,
      action: "Creación de un Usuario",
      details: `Se ha creado el Usuario llamado "${name}"`,
    });

    // Respond to User
    res.status(201).json({
      success: true,
      message: "User was created successfully",
    });
  } catch (err) {
    // Errors Handling
    console.error("[err]", err.message);
    res.status(500).json({
      message: "There was an error while creating the user",
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  const authenticatedUserId = req.userId;
  const { id: userId } = req.params;

  try {
    // Toggle User Status
    await UserModel.toggleUserStatus(userId);

    // Create Log
    await LogModel.createLog({
      createdAt: new Date(),
      userId: authenticatedUserId,
      action: "Actualización del Estado de un Usuario",
      details: `Se ha actualizado el Estado del Usuario con Id: ${userId}`,
    });

    // Respond to User
    res.status(200).json({
      success: true,
      message: "User status toggled successfully",
    });
  } catch (err) {
    // Errors Handling
    console.error("[err]", err.message);
    res.status(500).json({
      message: "There was an error while toggling user status",
    });
  }
};

exports.updateUser = async (req, res) => {
  const authenticatedUserId = req.userId;
  const { id: userId } = req.params;
  const {
    name,
    lastName,
    email,
    status,
    role,
    phone,
    locationAddress,
    locationLat,
    locationLng,
    details,
  } = req.body;

  try {
    // Update User
    await UserModel.updateUser(userId, {
      name,
      lastName,
      email,
      status,
      role,
      phone,
      locationAddress,
      locationLat,
      locationLng,
      details,
    });

    // Create Log
    await LogModel.createLog({
      createdAt: new Date(),
      userId: authenticatedUserId,
      action: "Actualización de un Usuario",
      details: `Se han actualizado los datos del Usuario llamado "${name}", con Id: ${userId}`,
    });

    // Respond To User
    res.status(200).json({
      success: true,
      message: "User was updated successfully",
    });
  } catch (err) {
    // Errors Handling
    console.error("[err]", err.message);
    res.status(500).json({
      message: "There was an error while updating the user",
    });
  }
};

exports.getUser = async (req, res) => {
  const { id: userId } = req.params;

  try {
    // Get User by ID
    const user = await UserModel.getUser(userId);

    if (user) {
      // Respond to User
      res.status(200).json({
        success: true,
        message: "User loaded successfully",
        user,
      });
    } else {
      // User Was Not Found response
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (err) {
    // Errors Handling
    console.error("[err]", err.message);
    res.status(500).json({
      message: "There was an error while getting the user",
    });
  }
};

exports.getUsers = async (req, res) => {
  const { page = 1, pageSize = 10, term = "" } = req.query;

  try {
    // Get All Users
    const { users, nextPage, totalUsers } = await UserModel.getUserList(
      page,
      pageSize,
      term
    );

    // Respond to the User
    res.status(200).json({
      success: true,
      message: "Users loaded successfully",
      users,
      pagination: {
        total: totalUsers,
        currentPage: parseInt(page),
        pageSize: parseInt(pageSize),
        nextPage,
      },
    });
  } catch (err) {
    // Errors handling
    console.error("[err]", err.message);
    res.status(500).json({
      message: "There was an error while getting the users",
    });
  }
};

exports.removeUser = async (req, res) => {
  const authenticatedUserId = req.userId;
  const { id: userId } = req.params;

  try {
    // Remove User
    await UserModel.deleteUser(userId);

    // Create Log
    await LogModel.createLog({
      createdAt: new Date(),
      userId: authenticatedUserId,
      action: "Eliminación de un Usuario",
      details: `Se eliminó el Usuario con Id: ${userId}`,
    });

    // Respond to User
    res.status(200).json({
      success: true,
      message: "User was removed successfully",
    });
  } catch (err) {
    // Errors Handling
    console.error("[err]", err.message);
    res.status(500).json({
      message: "There was an error while removing the user",
    });
  }
};

exports.removeUsers = async (req, res) => {
  const authenticatedUserId = req.userId;
  const { ids: userIdsToRemove } = req.body;

  try {
    // Remove Serveral Users
    await UserModel.deleteUsers(userIdsToRemove);

    // Create Log
    await LogModel.createLog({
      createdAt: new Date(),
      userId: authenticatedUserId,
      action: "Eliminación de Varios Usuarios",
      details: `Se eliminaron varios Usuarios con IDs: ${userIdsToRemove.join(
        ", "
      )}`,
    });

    // Respond to User
    res.status(200).json({
      success: true,
      message: "Users have been removed successfully",
    });
  } catch (err) {
    // Errors Handling
    console.error("[err]", err.message);
    res.status(500).json({
      message: "There was an error while removing several users",
    });
  }
};
