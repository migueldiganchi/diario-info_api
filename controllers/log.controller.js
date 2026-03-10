const Log = require("../models/log.model");

/**
 * @description Obtiene los logs del sistema con filtros y paginación.
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
      // Búsqueda flexible e insensible a mayúsculas/minúsculas
      query.action = { $regex: action, $options: "i" };
    }

    const logs = await Log.find(query)
      .populate("user", "name email alias") // Obtenemos datos básicos del usuario
      .sort({ createdAt: -1 }) // Los más recientes primero
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
      .json({ message: "Error al obtener los logs", error: error.message });
  }
};

module.exports = {
  getLogs,
};