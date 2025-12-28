require("dotenv").config();

const express = require("express");
const api = express();

// const { learn } = require("./util/ai");
const { API_PORT } = process.env;
const PORT = API_PORT || 3000;

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

// Prepare bot to respond the user
// learn();

// Parser
api.use(express.json());

// Routing: API
const authRouter = require("./routes/auth.router");
const userRouter = require("./routes/user.router");
const notificationRouter = require("./routes/notification.router");
const publicationRouter = require("./routes/publication.router");
const botRouter = require("./routes/bot.router");

// Routing Implementations
api.use(userRouter);
api.use(authRouter);
api.use(notificationRouter);
api.use(publicationRouter);
api.use(botRouter);

// Mongo Setup
mongoose.set("strictQuery", true); // O Avoid Warnings

// @todo: MySql Connection

// API Start
api.listen(PORT, () => {
  console.info(`DiarioInfo API is listening on http://localhost:${PORT}...`);
});
