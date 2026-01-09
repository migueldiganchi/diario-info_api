const { executeQuery } = require("../util/db");

const getLogList = async (page = 1, pageSize = 10, searchTerm = "") => {
  try {
    const offset = (page - 1) * pageSize;

    const query = `
      SELECT 
        l.id,
        l.createdAt,
        l.userId,
        l.action,
        l.details,
        u.name AS createdByName,
        u.email AS createdByEmail,
        u.pictureUrl AS createdByPictureUrl
      FROM 
        logs l
      INNER JOIN 
        users u ON l.userId = u.id
      WHERE 
        l.action LIKE ? OR 
        l.details LIKE ?  
      ORDER BY 
        l.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const params = [`%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];

    const rows = await executeQuery(query, params);

    const totalLogsQuery = `
      SELECT COUNT(*) as total
      FROM logs l
      INNER JOIN users u ON l.userId = u.id
      WHERE 
        l.action LIKE ? OR 
        l.details LIKE ?
    `;

    const totalLogsParams = [`%${searchTerm}%`, `%${searchTerm}%`];
    const totalLogsResult = await executeQuery(totalLogsQuery, totalLogsParams);
    const totalLogs = totalLogsResult[0].total;

    const nextPage = totalLogs > offset + pageSize ? page + 1 : null;

    return { logs: rows, nextPage, totalLogs };
  } catch (err) {
    throw new Error("Something went wrong while searching logs");
  }
};

const getLog = async (logId) => {
  try {
    const query = `
      SELECT 
        id,
        createdAt,
        userId,
        action,
        details
      FROM logs
      WHERE id = ?
    `;

    const result = await executeQuery(query, [logId]);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (err) {
    console.error("[error]", err);
    throw new Error("Something went wrong while fetching log details");
  }
};

const createLog = async (logData) => {
  const { createdAt, userId, action, details } = logData;

  try {
    const query = `
      INSERT INTO logs 
        (createdAt, userId, action, details) 
      VALUES (?, ?, ?, ?)
    `;

    const values = [createdAt, userId, action, details];

    await executeQuery(query, values);
  } catch (err) {
    console.error("[createLog] Error:", err);
    throw new Error("Something went wrong while creating a new log");
  }
};

module.exports = {
  getLogList,
  getLog,
  createLog,
};
