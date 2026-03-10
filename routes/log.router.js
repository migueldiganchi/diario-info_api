const express = require("express");
const router = express.Router();
const { getLogs } = require("../controllers/log.controller");

// Probablemente quieras añadir middlewares de autenticación y autorización aquí.
// const { isAuthenticated, isAdmin } = require("../middlewares/auth.middleware");

// GET /api/logs -> Obtiene todos los logs con filtros y paginación.
// Debería ser una ruta protegida solo para administradores.
router.get("/", /* isAuthenticated, isAdmin, */ getLogs);

module.exports = router;