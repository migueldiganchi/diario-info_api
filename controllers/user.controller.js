const User = require("../models/user.model.js");
const Qualification = require("../models/qualification.model.js");
const Publication = require("../models/publication.model.js");

const getUserByUnique = async (userId) => {
  let user = await User.findOne({ alias: userId }).select(
    "_id pictureUrl name alias bio email phone mobile locationAddress locationCountry locationCity"
  );

  // If Alias doesn't Work, find with Id
  if (!user) {
    // Get User by Id
    user = await User.findById(userId).select(
      "_id pictureUrl name alias bio email phone mobile locationAddress locationCountry locationCity"
    );
  }

  // Validate User
  if (!user) {
    res.status(404).json({
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
    const user = await getUserByUnique(userId);

    // Get User Qualifications from Database
    const userQualifications = await Qualification.find({
      toUser: user.id,
    }).populate("fromUser", "name pictureUrl");

    // General User Qualification
    if (userQualifications && userQualifications.length) {
      // Sum All Votes
      const userQualificationSum = userQualifications.reduce(
        (sum, userQualification) => sum + userQualification.rating,
        0
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
  const page = Math.max(0, req.query.page);
  const pageSize = Math.max(0, req.query.pageSize);
  const queryConditions = {};

  // USER STATUS FILTER
  queryConditions["status"] = "1";

  try {
    const users = await User.find(queryConditions)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
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

exports.getUserPublications = async (req, res) => {
  const page = Math.max(0, req.query.page);
  const pageSize = Math.max(0, req.query.pageSize);
  const typed = req.query.typed ? req.query.typed : "";
  const userId = req.params.id;
  const term = req.query.term ? req.query.term : "";
  const termRegex = new RegExp(term, "i"); // i for case insensitive searching
  const queryConditions = {};

  // Read User Information
  const user = await getUserByUnique(userId);

  // Read creator User
  queryConditions["createdBy"] = user.id;

  // Term Filter
  if (term != "") {
    queryConditions["$or"] = [{ title: termRegex }, { description: termRegex }];
  }

  // Typed Filter
  if (typed != "") {
    queryConditions["typed"] = typed;
  }

  // Publication Status Filter
  queryConditions["status"] = "1";

  try {
    const publications = await Publication.find(queryConditions)
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

    const total = await Publication.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    return res.status(200).json({
      success: true,
      publications,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    console.info("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while fetching user publications.",
    });
  }
};
