require("dotenv").config();

const express = require("express");
const api = express();

const PORT = process.env.PORT || 3000;

// Headers handler
api.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Accept, Content-Type, Authorization"
  );
  next();
});

// Parser
api.use(express.json());

// Routes
api.use(require("./routes/user.router"));
api.use(require("./routes/auth.router"));
api.use(require("./routes/notification.router"));
api.use(require("./routes/bot.router"));

api.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.API_ENVIRONMENT });
});

const server = api.listen(PORT || 3000, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});

module.exports = server;
