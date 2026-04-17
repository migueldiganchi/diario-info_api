// util/db.js
const mysql = require("mysql2/promise");
const path = require("path");

// We force load .env using an absolute path relative to this file
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Validate critical MySQL config early to avoid silent failures later
if (!DB_USER || !DB_NAME) {
  console.error("CRITICAL ERROR: MySQL environment variables are not defined.");
  console.error(
    "Check if your .env file exists and has DB_USER, DB_NAME, etc.",
  );
}

const pool = mysql.createPool({
  host: DB_HOST || "127.0.0.1", // At cPanel, localhost might not work
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const executeQuery = async (query, values = []) => {
  try {
    const [rows, fields] = await pool.query(query, values);
    console.info("[Info => Query fields]", fields?.length);
    return rows;
  } catch (err) {
    console.error("Database query error:", err);
    // We throw the original error to preserve technical details (sqlMessage, code, etc) for better debugging and logging
    throw err;
  }
};

module.exports = { pool, executeQuery };
