const { executeQuery } = require("../utils/mysql_db");

/**
 * Obtiene una nota de la tabla legacy NotasNuevas por su ID.
 * @param {number|string} id - El ID de la nota (NotaId).
 * @returns {Promise<Object|null>} - El objeto de la nota o null si no existe.
 */
const getExternalArticleById = async (id) => {
  const query = `
    SELECT 
      NotaId, 
      EdicionId, 
      SeccionId, 
      Pretitulo, 
      Titulo, 
      PostTitulo, 
      Resumen, 
      Nota, 
      Prioridad, 
      PieMultimedia, 
      Portada, 
      Usuario, 
      Destacada, 
      Contador, 
      ActivaImpreso
    FROM NotasNuevas 
    WHERE NotaId = ?
  `;

  const rows = await executeQuery(query, [id]);
  return rows && rows.length > 0 ? rows[0] : null;
};

module.exports = {
  getExternalArticleById,
};