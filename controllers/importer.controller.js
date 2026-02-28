const ImporterModel = require("../models/importer.model");
const Article = require("../models/article.model");
const Log = require("../models/log.model");

// Helper para generar slugs limpios
const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Reemplazar espacios con -
    .replace(/[^\w\-]+/g, "") // Eliminar caracteres no alfanuméricos
    .replace(/\-\-+/g, "-")   // Reemplazar múltiples - con uno solo
    .replace(/^-+/, "")       // Trim - del inicio
    .replace(/-+$/, "");      // Trim - del final
};

exports.importArticleById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send({ message: "El ID de la nota es requerido." });
  }

  try {
    // 1. Obtener datos de la fuente externa (MySQL)
    const externalArticle = await ImporterModel.getExternalArticleById(id);

    if (!externalArticle) {
      return res.status(404).send({ 
        message: `No se encontró la nota con ID ${id} en la base de datos externa.` 
      });
    }

    // 2. Preparar y transformar datos para MongoDB
    let slug = generateSlug(externalArticle.Titulo);
    
    // Verificar si ya existe un artículo con ese slug para evitar colisiones
    // Si existe, le agregamos el ID original al final para hacerlo único
    const existingArticle = await Article.findOne({ slug: slug });
    if (existingArticle) {
      slug = `${slug}-${id}`;
    }

    // Mapeo de campos: Legacy MySQL -> Mongoose Schema
    const newArticleData = {
      title: externalArticle.Titulo,
      slug: slug,
      description: externalArticle.Resumen || externalArticle.Titulo, // Fallback si no hay resumen
      content: externalArticle.Nota || "",
      
      // Manejo de imagen: Si no hay PieMultimedia, usamos un placeholder
      imageId: externalArticle.PieMultimedia && externalArticle.PieMultimedia.length > 5 
        ? externalArticle.PieMultimedia 
        : "default-placeholder.jpg",
        
      // Mapeo simple de categoría usando el ID de sección
      category: `Seccion-${externalArticle.SeccionId}`, 
      
      // Lógica de estado
      status: externalArticle.ActivaImpreso === 1 ? "published" : "draft",
      
      // Lógica de destacado
      isHighlighted: (externalArticle.Destacada === 1 || externalArticle.Portada === 1),
      
      author: externalArticle.Usuario || "Importado",
      priority: externalArticle.Prioridad ? String(externalArticle.Prioridad) : "0",
      destination: "web",
      articleType: "news",
      
      // Usamos Pretitulo y PostTitulo como puntos clave
      keyPoints: [externalArticle.Pretitulo, externalArticle.PostTitulo].filter(Boolean),
      
      // Fechas
      date: new Date().toISOString(),
      publicationDate: new Date(),
      
      // Auditoría
      createdBy: req.userId, 
    };

    // 3. Guardar en MongoDB
    const article = new Article(newArticleData);
    const savedArticle = await article.save();

    // 4. Registrar Log de la operación
    if (req.userId) {
      await Log.create({
        user: req.userId,
        action: "ARTICLE_IMPORTED",
        details: `Imported Article ID ${id} from MySQL as MongoID ${savedArticle._id}`,
      });
    }

    res.status(201).send({
      success: true,
      message: "Artículo importado exitosamente",
      article: savedArticle,
      originalId: id
    });

  } catch (err) {
    console.error("[Import Error]", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error durante la importación.",
    });
  }
};