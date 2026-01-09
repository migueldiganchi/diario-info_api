const { executeQuery } = require("../util/db");
const { getUsersByRole } = require("./user.model");

const createNotification = async (notificationData) => {
  const {
    fromUserId,
    toUserId,
    message,
    messageType,
    createdAt,
    deletedAt,
    updatedAt,
    readAt,
  } = notificationData;

  try {
    const query = `
      INSERT INTO notifications 
        (fromUserId, toUserId, message, messageType, createdAt, deletedAt, updatedAt, readAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      fromUserId || null,
      toUserId,
      message,
      messageType,
      createdAt,
      deletedAt,
      updatedAt,
      readAt,
    ];

    await executeQuery(query, values);
  } catch (err) {
    console.error("[createNotification] Error:", err);
    throw new Error("Something went wrong while creating a new notification");
  }
};

const createNotificationToUsers = async (
  role,
  message,
  messageType = "info"
) => {
  try {
    // Get users by role
    const users = await getUsersByRole(role);

    // Create notification for each user
    for (const user of users) {
      await createNotification({
        toUserId: user.id,
        message,
        messageType,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    console.error(
      "Error al enviar el mensaje a los usuarios con cierto rol:",
      err
    );
    throw new Error(
      "Error al enviar el mensaje a los usuarios con cierto rol."
    );
  }
};

const getNotificationList = async (
  userId,
  page,
  pageSize,
  term,
  source,
  kind,
  readStatus,
  isArchived
) => {
  try {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    let query = `
      SELECT * FROM notifications
      WHERE toUserId = ? AND message LIKE ? 
    `;

    let values = [userId, `%${term}%`];

    // Notification Source
    if (source && source === "app") {
      query += `AND fromUserId IS NULL `;
    } else if (source && source === "users") {
      query += `AND fromUserId IS NOT NULL `;
    }

    // Check isArchived
    if (isArchived !== undefined && isArchived === "true") {
      query += `AND isArchived = ? `;
      values.push(isArchived);
    }

    // Check Reading Status
    if (readStatus !== undefined) {
      query +=
        readStatus === "read"
          ? `AND readAt IS NOT NULL `
          : readStatus === "unread"
          ? `AND readAt IS NULL `
          : "";
    }

    // Notification Type
    if (kind) {
      query += `AND messageType = ? `;
      values.push(kind);
    }

    // Order by read status (unread first, then read) and by creation date
    query += `
      ORDER BY 
        CASE 
          WHEN readAt IS NULL THEN 1 
          ELSE 2 
        END, 
        createdAt DESC 
    `;

    // Pagination
    query += `LIMIT ?, ?`;

    values.push(offset, limit);

    // Run Paginated Notifications
    const notifications = await executeQuery(query, values);

    // Count total notifications for pagination
    let totalNotificationsQuery = `
      SELECT 
        COUNT(*) as total 
      FROM notifications 
      WHERE toUserId = ? AND message LIKE ? `;

    // Check for Filters
    let totalValues = [userId, `%${term}%`];

    // Check for All isArchived
    if (isArchived !== undefined) {
      totalNotificationsQuery += `AND isArchived = ? `;
      totalValues.push(isArchived);
    }

    // Check for All isRead
    if (readStatus !== undefined) {
      totalNotificationsQuery +=
        readStatus === "read"
          ? `AND readAt IS NOT NULL `
          : readStatus === "unread"
          ? `AND readAt IS NULL `
          : "";
    }

    // Check for All Sources
    if (source === "app") {
      totalNotificationsQuery += `AND fromUserId IS NULL `;
    } else if (source === "users") {
      totalNotificationsQuery += `AND fromUserId IS NOT NULL `;
    }

    // Check for All Notification Type
    if (kind) {
      totalNotificationsQuery += `AND messageType = ? `;
      totalValues.push(kind);
    }

    // Execute the total count query
    const totalNotificationsResult = await executeQuery(
      totalNotificationsQuery,
      totalValues
    );

    // Count All Notifications
    const totalNotifications = totalNotificationsResult[0]?.total;

    // Determine nextPage
    const nextPage = totalNotifications > offset + pageSize ? page + 1 : null;

    return { notifications, nextPage, totalNotifications };
  } catch (err) {
    console.error("[getNotificationList] Error:", err);
    throw new Error("Something went wrong while fetching notifications");
  }
};

const getNotification = async (notificationId) => {
  try {
    const query = "SELECT * FROM notifications WHERE id = ?";
    const values = [notificationId];
    const notifications = await executeQuery(query, values);
    return notifications[0];
  } catch (err) {
    console.error("[getNotification] Error:", err);
    throw new Error("Something went wrong while fetching notification");
  }
};

const deleteNotification = async (notificationId) => {
  const query = "DELETE FROM notifications WHERE id = ?";
  const values = [notificationId];
  await executeQuery(query, values);
};

const toggleReadingStatus = async (notificationId, isRead) => {
  const query = "UPDATE notifications SET readAt = ? WHERE id = ?";
  const values = [isRead ? new Date() : null, notificationId];
  return await executeQuery(query, values);
};

module.exports = {
  createNotification,
  createNotificationToUsers,
  getNotificationList,
  getNotification,
  deleteNotification,
  toggleReadingStatus,
};
