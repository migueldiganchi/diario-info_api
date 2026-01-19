require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const api = express();
const connectionString = require("./util/mongo_db").getConnectionString();

const { API_PORT } = process.env;
const PORT = API_PORT || 3000;

// Headers handler
api.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Accept, Content-Type, Authorization",
  );
  next();
});

// Parser
api.use(express.json());

// Routes
api.use(require("./routes/user.router"));
api.use(require("./routes/article.router"));
api.use(require("./routes/auth.router"));
api.use(require("./routes/notification.router"));
api.use(require("./routes/bot.router"));

api.get("/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.API_ENVIRONMENT,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Mongo connection + API start
mongoose
  .connect(connectionString, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB connected");

    const server = api.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 API running on port ${PORT}`);
    });

    module.exports = server;
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
