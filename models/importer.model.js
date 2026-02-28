const { executeQuery } = require("../utils/mysql_db");

/**
 * Retrieves a note from the legacy NotasNuevas table by its ID.
 * @param {number|string} id - The ID of the note (NotaId).
 * @returns {Promise<Object|null>} - The note object or null if it does not exist.
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