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
      CONVERT(CAST(Pretitulo AS BINARY) USING utf8mb4) AS Pretitulo, 
      CONVERT(CAST(Titulo AS BINARY) USING utf8mb4) AS Titulo, 
      CONVERT(CAST(PostTitulo AS BINARY) USING utf8mb4) AS PostTitulo, 
      CONVERT(CAST(Resumen AS BINARY) USING utf8mb4) AS Resumen, 
      CONVERT(CAST(Nota AS BINARY) USING utf8mb4) AS Nota, 
      Prioridad, 
      CONVERT(CAST(PieMultimedia AS BINARY) USING utf8mb4) AS PieMultimedia, 
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

/**
 * Retrieves the section name from the legacy Secciones table by its ID.
 * @param {number|string} id - The ID of the section (SeccionId).
 * @returns {Promise<string|null>} - The section name or null if it does not exist.
 */
const getSeccionById = async (id) => {
  const query = "SELECT CONVERT(CAST(Seccion AS BINARY) USING utf8mb4) AS Seccion FROM Secciones WHERE SeccionId = ?";
  const rows = await executeQuery(query, [id]);
  return rows && rows.length > 0 ? rows[0].Seccion : null;
};

module.exports = {
  getExternalArticleById,
  getSeccionById,
};