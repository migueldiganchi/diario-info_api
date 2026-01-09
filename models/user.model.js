// user.model.js
const { executeQuery } = require("../util/db");

const getUsers = async (page = 1, pageSize = 10, term = "") => {
  try {
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT 
        id, 
        name, 
        lastName, 
        email, 
        pictureUrl,
        status, 
        role, 
        phone,
        locationAddress, 
        locationLat, 
        locationLng, 
        details, 
        status, 
        createdAt, 
        updatedAt, 
        deletedAt 
      FROM 
        users 
      WHERE 
        deletedAt IS NULL
    `;

    const params = [];

    // Apply search term if provided
    if (term) {
      query += ` AND (name LIKE ? OR lastName LIKE ? OR email LIKE ?)`;
      params.push(`%${term}%`, `%${term}%`, `%${term}%`);
    }

    // Count total users without pagination
    let countQuery = `
      SELECT COUNT(*) AS total 
      FROM users 
      WHERE deletedAt IS NULL
    `;
    const countParams = [];

    // Apply search term if provided
    if (term) {
      countQuery += ` AND (name LIKE ? OR lastName LIKE ? OR email LIKE ?)`;
      countParams.push(`%${term}%`, `%${term}%`, `%${term}%`);
    }

    const countResult = await executeQuery(countQuery, countParams);
    const totalUsers = countResult[0].total;

    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;

    params.push(pageSize, offset);

    const rows = await executeQuery(query, params);
    const nextPage = offset + rows.length < totalUsers ? page + 1 : null;

    return { users: rows, nextPage, totalUsers };
  } catch (err) {
    throw new Error("Something went wrong while searching users");
  }
};

const getUsersByRole = async (role) => {
  const query = "SELECT * FROM users WHERE role = ?";
  const values = [role];
  const users = await executeQuery(query, values);
  return users;
};

const getUserById = async (userId) => {
  const query =
    "SELECT id, name, lastName, email, password, pictureUrl, status, role, phone, locationAddress, locationLat, locationLng, details, createdAt, updatedAt, deletedAt FROM users WHERE id = ? AND deletedAt IS NULL";
  const rows = await executeQuery(query, [userId]);
  return rows[0];
};

const getUserByEmail = async (email) => {
  const query =
    "SELECT id, name, lastName, email, password, pictureUrl, status, role, phone, locationAddress, locationLat, locationLng, details, createdAt, updatedAt, deletedAt FROM users WHERE email = ? AND deletedAt IS NULL";
  const rows = await executeQuery(query, [email]);
  return rows[0];
};

const getUserBySignupToken = async (token) => {
  const query =
    "SELECT id, name, lastName, email, password, pictureUrl, status, role, phone, locationAddress, locationLat, locationLng, details, createdAt, updatedAt, deletedAt FROM users WHERE signupToken = ? AND signupTokenExpiresAt > NOW() AND deletedAt IS NULL";
  const rows = await executeQuery(query, [token]);
  return rows[0];
};

const createUser = async (userData) => {
  const {
    name,
    lastName,
    email,
    password,
    role,
    phone,
    locationAddress,
    locationLat,
    locationLng,
    details,
    status,
    signupToken,
    signupTokenExpiresAt,
  } = userData;

  const query = `
    INSERT INTO users (
      name, 
      lastName, 
      email, 
      role, 
      phone, 
      locationAddress, 
      locationLat, 
      locationLng, 
      details, 
      password, 
      status, 
      signupToken, 
      signupTokenExpiresAt, 
      createdAt, 
      updatedAt, 
      deletedAt
    ) VALUES (
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      ?, 
      NOW(), 
      NOW(), 
      NULL
    )
  `;

  const values = [
    name,
    lastName,
    email,
    role || null,
    phone || null,
    locationAddress || null,
    locationLat || null,
    locationLng || null,
    details || null,
    password || null,
    status || "0",
    signupToken || null,
    signupTokenExpiresAt || null,
  ];

  return await executeQuery(query, values);
};

const updateUser = async (userId, newData) => {
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
    pictureUrl,
    signupToken,
    signupTokenExpiresAt,
  } = newData;

  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name);
  }
  if (lastName !== undefined) {
    fields.push("lastName = ?");
    values.push(lastName);
  }
  if (email !== undefined) {
    fields.push("email = ?");
    values.push(email);
  }
  if (status !== undefined) {
    fields.push("status = ?");
    values.push(status);
  }
  if (role !== undefined) {
    fields.push("role = ?");
    values.push(role);
  }
  if (phone !== undefined) {
    fields.push("phone = ?");
    values.push(phone);
  }
  if (locationAddress !== undefined) {
    fields.push("locationAddress = ?");
    values.push(locationAddress);
  }
  if (locationLat !== undefined) {
    fields.push("locationLat = ?");
    values.push(locationLat);
  }
  if (locationLng !== undefined) {
    fields.push("locationLng = ?");
    values.push(locationLng);
  }
  if (details !== undefined) {
    fields.push("details = ?");
    values.push(details);
  }
  if (pictureUrl !== undefined) {
    fields.push("pictureUrl = ?");
    values.push(pictureUrl);
  }
  if (signupToken !== undefined) {
    fields.push("signupToken = ?");
    values.push(signupToken);
  }
  if (signupTokenExpiresAt !== undefined) {
    fields.push("signupTokenExpiresAt = ?");
    values.push(signupTokenExpiresAt);
  }

  // Always update the updatedAt field
  fields.push("updatedAt = NOW()");

  values.push(userId);

  const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

  await executeQuery(query, values);
};

const updateUserPassword = async (userId, newPassword) => {
  const query = "UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?";
  const values = [newPassword, userId];

  try {
    await executeQuery(query, values);
  } catch (err) {
    throw new Error("Something went wrong while updating the user password");
  }
};

const updateUserPictureUrl = async (userId, userPictureUrl) => {
  const query =
    "UPDATE users SET pictureUrl = ?, updatedAt = NOW() WHERE id = ?";
  const values = [userPictureUrl, userId];

  try {
    await executeQuery(query, values);
  } catch (err) {
    throw new Error("Something went wrong while updating the user picture URL");
  }
};

const deleteUser = async (userId) => {
  const query = "UPDATE users SET deletedAt = NOW() WHERE id = ?";
  const values = [userId];
  await executeQuery(query, values);
};

const deleteUsers = async (userIds) => {
  const query = "UPDATE users SET deletedAt = NOW() WHERE id IN (?)";
  await executeQuery(query, [userIds]);
};

const toggleUserStatus = async (userId) => {
  // Get User
  const currentUser = await getUserById(userId);
  if (!currentUser) {
    throw new Error("User not found");
  }

  // Set New Status
  const newStatus = currentUser.status === "1" ? "0" : "1";

  // Update User Status
  const query = "UPDATE users SET status = ?, updatedAt = NOW() WHERE id = ?";

  // Execute Query
  await executeQuery(query, [newStatus, userId]);
};

const activateUser = async (userId) => {
  const query =
    "UPDATE users SET status = '1', signupToken = NULL, signupTokenExpiresAt = NULL, updatedAt = NOW() WHERE id = ?";
  await executeQuery(query, [userId]);
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  getUsersByRole,
  createUser,
  updateUser,
  updateUserPassword,
  updateUserPictureUrl,
  deleteUser,
  deleteUsers,
  toggleUserStatus,
  getUserBySignupToken,
  activateUser,
};
