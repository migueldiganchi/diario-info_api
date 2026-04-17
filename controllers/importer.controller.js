const ImporterModel = require("../models/importer.model");
const Article = require("../models/article.model");
const Category = require("../models/category.model");
const Log = require("../models/log.model");

// Helper to generate clean slugs
const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove non-alphanumeric characters
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
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
        message: `No se encontró la nota con ID ${id} en la base de datos externa.`,
      });
    }

    // 2. Resolve Category
    let category = null;
    const mysqlSeccionName = await ImporterModel.getSeccionById(
      externalArticle.SeccionId,
    );

    if (mysqlSeccionName) {
      // We fetch all categories to compare in-memory and ensure accuracy with UpperCase
      const allCategories = await Category.find({ disabledAt: null });
      category = allCategories.find(
        (c) =>
          c.name.trim().toUpperCase() === mysqlSeccionName.trim().toUpperCase(),
      );
    }

    // Fallback to "Global" if no name match is found
    if (!category) {
      const fallbackName = "Global";
      category = await Category.findOne({
        name: { $regex: new RegExp(`^${fallbackName}$`, "i") },
      });

      if (!category) {
        category = new Category({
          name: fallbackName,
          slug: "global",
          description:
            "Artículos importados cuya sección original no fue encontrada.",
          order: 999,
        });
        await category.save();
      }
    }

    // 3. Prepare data for MongoDB
    let slug = generateSlug(externalArticle.Titulo);
    const existingArticle = await Article.findOne({ slug: slug });
    if (existingArticle) {
      slug = `${slug}-${id}`;
    }

    const newArticleData = {
      title: externalArticle.Titulo,
      slug: slug,
      description: externalArticle.Resumen || externalArticle.Titulo,
      content: externalArticle.Nota || "",
      imageId: null,
      category: category._id,
      status: externalArticle.ActivaImpreso === 1 ? "published" : "draft",
      isHighlighted:
        externalArticle.Destacada === 1 || externalArticle.Portada === 1,
      author: externalArticle.Usuario || "Importado",
      priority: Number(externalArticle.Prioridad) || 0,
      keyPoints: [externalArticle.Pretitulo, externalArticle.PostTitulo].filter(
        Boolean,
      ),
      date: new Date().toISOString(),
      publicationDate: new Date(),
      createdBy: req.userId,
    };

    const article = new Article(newArticleData);
    const savedArticle = await article.save();

    if (req.userId) {
      await Log.create({
        user: req.userId,
        action: "ARTICLE_IMPORTED",
        details: `Imported Article ID ${id} from MySQL`,
      });
    }

    res.status(201).send({
      success: true,
      message: "Artículo importado exitosamente",
      article: savedArticle,
      originalId: id,
    });
  } catch (err) {
    console.error("[IMPORT ERROR - FULL]", err);

    // Serializamos el error de forma segura para la respuesta
    const errorDetails =
      process.env.NODE_ENV === "production"
        ? {
            message:
              "Error técnico durante la importación. Contacte al soporte.",
          }
        : {
            message: err.message,
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState,
            code: err.code,
            errno: err.errno,
            sql: err.sql,
            connectionDebug: {
              host: process.env.DB_HOST,
              user: process.env.DB_USER,
              database: process.env.DB_NAME,
            },
          };

    res.status(500).send({
      success: false,
      message: "Error técnico detallado para depuración.",
      error: errorDetails,
      stack: process.env.NODE_ENV === "production" ? null : err.stack, // Mantenemos el stack para ubicar la línea exacta en el código
    });
  }
};
