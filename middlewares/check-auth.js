const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.userId = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    const decodedToken = jwt.verify(token, "some_super_secret_text");
    req.userId = decodedToken ? decodedToken.userId : null;
  } catch (err) {
    req.userId = null;
  }

  next();
};
