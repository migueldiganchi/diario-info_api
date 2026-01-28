// ❌ NO dotenv en cPanel
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const api = express();

// =======================
// Middlewares
// =======================
api.use((req, res, next) => {
  // Log request
  console.log(
    `[REQ] ${req.method} ${req.originalUrl} | Origin: ${
      req.headers.origin || "N/A"
    } | UA: ${req.headers["user-agent"] || "N/A"}`,
  );

  // Headers CORS allowed
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Headers methods allowed
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  // Headers allowed
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Accept, Content-Type, Authorization",
  );

  // Continue to routes
  next();
});

api.use(express.json());

// =======================
// Routes
// =======================
api.use(require("./routes/user.router"));
api.use(require("./routes/article.router"));
api.use(require("./routes/auth.router"));
api.use(require("./routes/notification.router"));
api.use(require("./routes/bot.router"));

// =======================
// Health check
// =======================
api.get("/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "unknown",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// =======================
// Start server (Passenger)
// =======================
const PORT = process.env.PORT || 3000;

api.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);

  // =======================
  // Mongo connection (SAFE)
  // =======================
  const getConnectionString = require("./util/mongo_db").getConnectionString;

  let conn;
  try {
    conn = getConnectionString();
  } catch (err) {
    console.error("❌ Mongo config error:", err.message);
    return; // 👈 NO matar Passenger
  }

  if (!conn) {
    console.warn("⚠️ MongoDB not configured");
    return;
  }

  mongoose.set("strictQuery", false);

  mongoose
    .connect(conn, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    })
    .then(() => {
      console.log("✅ MongoDB connected");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err.message);
    });
});
