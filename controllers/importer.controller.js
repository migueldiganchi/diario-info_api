const ImporterModel = require("../models/importer.model");
const Article = require("../models/article.model");
const Log = require("../models/log.model");

// Helper to generate clean slugs
const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove non-alphanumeric characters
    .replace(/\-\-+/g, "-")   // Replace multiple - with single -
    .replace(/^-+/, "")       // Trim - from start
    .replace(/-+$/, "");      // Trim - from end
};

exports.importArticleById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send({ message: "El ID de la nota es requerido." });
  }

  try {
    // 1. Get data from external source (MySQL)
    const externalArticle = await ImporterModel.getExternalArticleById(id);

    if (!externalArticle) {
      return res.status(404).send({ 
        message: `No se encontró la nota con ID ${id} en la base de datos externa.` 
      });
    }

    // 2. Prepare and transform data for MongoDB
    let slug = generateSlug(externalArticle.Titulo);
    
    // Check if an article with that slug already exists to avoid collisions
    // If it exists, append the original ID to the end to make it unique
    const existingArticle = await Article.findOne({ slug: slug });
    if (existingArticle) {
      slug = `${slug}-${id}`;
    }

    // Field mapping: Legacy MySQL -> Mongoose Schema
    const newArticleData = {
      title: externalArticle.Titulo,
      slug: slug,
      description: externalArticle.Resumen || externalArticle.Titulo, // Fallback if summary is empty
      content: externalArticle.Nota || "",
      
      // Image handling: If no PieMultimedia, use a placeholder
      imageId: externalArticle.PieMultimedia && externalArticle.PieMultimedia.length > 5 
        ? externalArticle.PieMultimedia 
        : "default-placeholder.jpg",
        
      // Simple category mapping using section ID
      category: `Seccion-${externalArticle.SeccionId}`, 
      
      // Status logic
      status: externalArticle.ActivaImpreso === 1 ? "published" : "draft",
      
      // Highlighted logic
      isHighlighted: (externalArticle.Destacada === 1 || externalArticle.Portada === 1),
      
      author: externalArticle.Usuario || "Importado",
      priority: externalArticle.Prioridad ? String(externalArticle.Prioridad) : "0",
      destination: "web",
      articleType: "news",
      
      // Use Pretitulo and PostTitulo as key points
      keyPoints: [externalArticle.Pretitulo, externalArticle.PostTitulo].filter(Boolean),
      
      // Dates
      date: new Date().toISOString(),
      publicationDate: new Date(),
      
      // Audit
      createdBy: req.userId, 
    };

    // 3. Save to MongoDB
    const article = new Article(newArticleData);
    const savedArticle = await article.save();

    // 4. Register Log of the operation
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