const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const authError = new Error("Not authenticated");
    authError.statusCode = 401;
    throw authError;
  }
  const token = authHeader.split(" ")[1];
  let decodedToken = null;

  try {
    decodedToken = jwt.verify(token, "some_super_secret_text");
  } catch (err) {
    console.error("[error]", err);
    return res.status(403).send({
      message: "Something when wrong after check token",
    });
  }

  if (!decodedToken) {
    const authError = new Error("Not authenticated");
    authError.statusCode = 402;
    throw authError;
  }

  req.userId = decodedToken.userId;

  next();
};
