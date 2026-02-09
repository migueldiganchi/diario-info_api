const User = require("../models/user.model.js");
const Qualification = require("../models/qualification.model.js");
const Article = require("../models/article.model.js");
const Log = require("../models/log.model.js");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const getUserByUnique = async (userId, res) => {
  let user = await User.findOne({ alias: userId }).select(
    "_id pictureUrl name lastName alias bio email phone locationAddress locationCountry locationCity",
  );

  // If Alias doesn't Work, find with Id
  if (!user) {
    // Get User by Id
    user = await User.findById(userId).select(
      "_id pictureUrl name lastName alias bio email phone locationAddress locationCountry locationCity",
    );
  }

  // Validate User
  if (!user) {
    return res.status(404).json({
      message: `User was not Found with userId: ${userId}`,
    });
  }

  return user;
};

exports.getUser = async (req, res) => {
  const userId = req.params.id;

  let userRatingData = null;
  let userQualificationAvg = 0;

  try {
    // Read User Information
    const user = await getUserByUnique(userId, res);
    if (!user) return;

    // Get User Qualifications from Database
    const userQualifications = await Qualification.find({
      toUser: user.id,
    }).populate("fromUser", "name pictureUrl");

    // General User Qualification
    if (userQualifications && userQualifications.length) {
      // Sum All Votes
      const userQualificationSum = userQualifications.reduce(
        (sum, userQualification) => sum + userQualification.rating,
        0,
      );

      // Calculate Average of Qualifications
      userQualificationAvg =
        userQualifications && userQualifications.length
          ? userQualificationSum / userQualifications.length
          : 0;

      // Response Structure
      userRatingData = {
        qualificationAvg: userQualificationAvg,
        qualifications: userQualifications,
      };
    }

    // Respond to user
    res.status(200).json({
      success: true,
      message: "User loaded successfully",
      user: user,
      userRatingData,
    });
  } catch (err) {
    // Error hanlder
    console.log("[err]", err);
    res.status(500).json({
      message: "There was an error while get the user",
    });
  }
};

exports.getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { name, role, status } = req.query;

  const queryConditions = {};

  // Status Filter
  if (status !== undefined) {
    queryConditions.status = status;
  }

  // Role Filter
  if (role) {
    queryConditions.role = role;
  }

  // Search Term
  if (name) {
    const regex = new RegExp(name, "i");
    queryConditions.$or = [{ name: regex }, { email: regex }, { alias: regex }];
  }

  try {
    const users = await User.find(queryConditions)
      .sort({ createdAt: -1, _id: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .select(
        "_id name lastName alias email role status pictureUrl bio locationCity locationCountry",
      )
      .exec();
    const total = await User.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    return res.status(200).json({
      success: true,
      users,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    console.info("[err]", err);
    return res.status(500).send({
      message: err.message || "Something went wrong while fetching all users.",
    });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, password, role, bio, locationCountry, locationCity } =
    req.body;

  try {
    // Check permissions
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin()) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate Alias
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const baseAlias = name
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const alias = `${baseAlias}-${randomSuffix}`;

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "Reader",
      alias,
      bio,
      locationCountry,
      locationCity,
      createdAt: Date.now(),
      status: 1, // Active
    });

    const savedUser = await newUser.save();

    // Log action
    const log = new Log({
      user: req.userId,
      action: "USER_CREATED",
      details: `User ${savedUser.email} (${savedUser._id}) created by Admin`,
    });
    await log.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: savedUser,
    });
  } catch (err) {
    console.error("[createUser]", err);
    res.status(500).json({
      message: err.message || "Error creating user",
    });
  }
};

exports.updateUser = async (req, res) => {
  const userIdToUpdate = req.params.id;
  const {
    name,
    alias,
    bio,
    locationCountry,
    locationCity,
    phone,
    pictureUrl,
    role,
  } = req.body;

  try {
    // Check permissions
    const requester = await User.findById(req.userId);
    if (!requester) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    // Allow if admin or if updating self
    if (!requester.isAdmin() && requester._id.toString() !== userIdToUpdate) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    const userToUpdate = await User.findById(userIdToUpdate);
    if (!userToUpdate) {
      return res.status(404).json({
        message: `User was not found with userId: ${userIdToUpdate}`,
      });
    }

    // Update fields
    if (name) userToUpdate.name = name;
    if (alias) userToUpdate.alias = alias;
    if (bio) userToUpdate.bio = bio;
    if (locationCountry) userToUpdate.locationCountry = locationCountry;
    if (locationCity) userToUpdate.locationCity = locationCity;
    if (phone) userToUpdate.phone = phone;
    if (pictureUrl) userToUpdate.pictureUrl = pictureUrl;

    // Only Admin can update role
    if (role && requester.isAdmin()) {
      userToUpdate.role = role;
    }

    const updatedUser = await userToUpdate.save();

    // Log action
    const log = new Log({
      user: req.userId,
      action: "USER_UPDATED",
      details: `User ${updatedUser.email} (${updatedUser._id}) updated by ${requester.email}`,
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("[updateUser]", err);
    res.status(500).json({
      message: err.message || "Error updating user",
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  const userIdToUpdate = req.params.id;
  const { status } = req.body;

  try {
    // Check permissions
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin()) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    // Validate status
    const newStatus = Number(status);
    if (status === undefined || ![0, 1].includes(newStatus)) {
      return res.status(400).json({
        message:
          "Invalid status provided. Status must be 0 (inactive) or 1 (active).",
      });
    }

    const userToUpdate = await User.findById(userIdToUpdate);
    if (!userToUpdate) {
      return res.status(404).json({
        message: `User was not found with userId: ${userIdToUpdate}`,
      });
    }

    // Prevent admin from deactivating themselves
    if (userToUpdate._id.toString() === req.userId) {
      return res.status(400).json({
        message: "You cannot change your own status.",
      });
    }

    userToUpdate.status = newStatus;
    userToUpdate.disabledAt = newStatus === 1 ? null : new Date();

    if (newStatus === 1) {
      userToUpdate.signupTokenActivatedAt = new Date();
      userToUpdate.signupTokenExpiresAt = null;
      userToUpdate.signupToken = null;
    } else {
      userToUpdate.signupTokenActivatedAt = null;
    }

    const updatedUser = await userToUpdate.save();

    // Log action
    const log = new Log({
      user: req.userId,
      action: "USER_STATUS_UPDATED",
      details: `User ${updatedUser.email} (${updatedUser._id}) status changed to ${updatedUser.status} by Admin ${adminUser.email}`,
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: "User status updated successfully.",
    });
  } catch (err) {
    console.error("[updateUserStatus]", err);
    res.status(500).json({
      message: err.message || "Error updating user status",
    });
  }
};

exports.deleteUser = async (req, res) => {
  const userIdToDelete = req.params.id;

  try {
    // Check permissions
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin()) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    // Prevent admin from deleting themselves
    if (userIdToDelete === req.userId) {
      return res.status(400).json({
        message: "You cannot delete your own account.",
      });
    }

    const deletedUser = await User.findByIdAndDelete(userIdToDelete);

    if (!deletedUser) {
      return res.status(404).json({
        message: `User was not found with userId: ${userIdToDelete}`,
      });
    }

    // Log action
    const log = new Log({
      user: req.userId,
      action: "USER_DELETED",
      details: `User ${deletedUser.email} (${deletedUser._id}) was deleted by Admin ${adminUser.email}`,
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error("[deleteUser]", err);
    res.status(500).json({
      message: err.message || "Error deleting user",
    });
  }
};

exports.createUserQualification = async (req, res) => {
  const fromUserId = req.userId;
  const { toUserId, rating, comment } = req.body;

  // Create Qualification
  const newQualification = new Qualification({
    fromUser: fromUserId,
    toUser: toUserId,
    rating: rating,
    comment: comment,
    createdAt: Date.now(),
  });

  try {
    // Save New Qualification
    const createdQualification = await newQualification.save();

    // Log action
    const log = new Log({
      user: fromUserId,
      action: "QUALIFICATION_CREATED",
      details: `User ${fromUserId} rated User ${toUserId} with ${rating}`,
    });
    await log.save();

    // Respond to the User
    res.status(201).json({
      success: true,
      message: "Qualification was created successfully",
      qualification: createdQualification,
    });
  } catch (err) {
    // Error hanlder
    console.log("[err]", err);
    res.status(500).json({
      message: "There was an error while rate the user",
    });
  }
};

exports.updateUserQualification = async (req, res) => {
  const fromUserId = req.userId;
  const toUserId = req.params.id;
  const { comment, rating } = req.body;

  try {
    // Recover Qualification To Update
    const qualificationToUpdate = await Qualification.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
    });

    // Check for Errors
    if (!qualificationToUpdate) {
      console.error("[err]", err);
      return res.status(404).send({
        message: err.message || "Qualification was not found",
      });
    }

    // Update Qualification
    qualificationToUpdate.comment = comment;
    qualificationToUpdate.rating = rating;
    qualificationToUpdate.updatedAt = Date.now();
    const updatedQualification = await qualificationToUpdate.save();

    // Log action
    const log = new Log({
      user: fromUserId,
      action: "QUALIFICATION_UPDATED",
      details: `User ${fromUserId} updated rating for User ${toUserId}`,
    });
    await log.save();

    return res.status(201).json({
      success: true,
      message: "Qualification was updated successfully",
      qualification: updatedQualification,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while updating the Qualification.",
    });
  }
};

exports.getUserQualification = async (req, res) => {
  const fromAuthenticatedUserId = req.userId;
  const toUserId = req.params.id;

  try {
    const userQualification = await Qualification.findOne({
      fromUser: fromAuthenticatedUserId,
      toUser: toUserId,
    }).populate("fromUser", "name pictureUrl");

    // Respond to user
    res.status(200).json({
      success: true,
      qualification: userQualification,
    });
  } catch (err) {
    // Error hanlder
    console.log("[err]", err);
    res.status(500).json({
      message: "There was an error while get the user",
    });
  }
};

exports.getUserArticles = async (req, res) => {
  const page = Math.max(0, req.query.page);
  const pageSize = Math.max(0, req.query.pageSize);
  const typed = req.query.typed ? req.query.typed : "";
  const userId = req.params.id;
  const term = req.query.term ? req.query.term : "";
  const termRegex = new RegExp(term, "i"); // i for case insensitive searching
  const queryConditions = {};

  // Read User Information
  const user = await getUserByUnique(userId, res);
  if (!user) return;

  // Read creator User
  queryConditions["createdBy"] = user.id;

  // Term Filter
  if (term != "") {
    queryConditions["$or"] = [{ title: termRegex }, { description: termRegex }];
  }

  // Typed Filter
  if (typed != "") {
    queryConditions["articleType"] = typed;
  }

  // Article Status Filter
  queryConditions["status"] = "published";

  try {
    const articles = await Article.find(queryConditions)
      .populate({
        path: "createdBy",
        model: "User",
        select:
          "_id name phone locationAddress locationCountry locationCity pictureUrl",
      })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .exec();

    const total = await Article.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    return res.status(200).json({
      success: true,
      articles,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    console.info("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while fetching user articles.",
    });
  }
};
