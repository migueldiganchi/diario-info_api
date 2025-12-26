// util/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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
    throw new Error("Database query error");
  }
};

module.exports = { pool, executeQuery };
