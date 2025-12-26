const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  // Si no hay un token, simplemente continuamos
  if (!authHeader) {
    req.userId = null;  // No se establece un usuario
    return next();
  }

  const token = authHeader.split(" ")[1];
  let decodedToken = null;

  try {
    decodedToken = jwt.verify(token, "some_super_secret_text");
  } catch (error) {
    // Si hay un error en la verificación del token, lo ignoramos y continuamos
    req.userId = null;
    return next();
  }

  // Si no hay token decodificado, no se registra el usuario
  if (!decodedToken) {
    req.userId = null;
    return next();
  }

  // Establecer el userId si el token es válido
  req.userId = decodedToken.userId;

  next();
};
