const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  let decodedToken = null;

  try {
    decodedToken = jwt.verify(token, "some_super_secret_text");
  } catch (error) {
    return res.status(403).send({
      message: "Something when wrong after check token",
    });
  }

  if (!decodedToken) {
    const err = new Error("Not authenticated");
    console.error("[error]", err);
    return res.status(401).send({
      message: "Not authorized request",
    });
  }

  req.userId = decodedToken.userId;

  next();
};
