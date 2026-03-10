const Log = require("../models/log.model");

/**
 * @description Get system logs with filtering and pagination.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action } = req.query;

    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (action) {
      // Flexible and case-insensitive search
      query.action = { $regex: action, $options: "i" };
    }

    const logs = await Log.find(query)
      .populate("user", "name email alias") // Get basic user data
      .sort({ createdAt: -1 }) // Most recent first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalLogs = await Log.countDocuments(query);

    res.status(200).json({
      logs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: parseInt(page),
      totalLogs,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting logs", error: error.message });
  }
};

module.exports = {
  getLogs,
};