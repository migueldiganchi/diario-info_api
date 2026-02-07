const Article = require("../models/article.model.js");
const Log = require("../models/log.model.js");
const User = require("../models/user.model.js");

// Create and Save a new Article
exports.createArticle = async (req, res) => {
  // Validate request
  if (!req.body) {
    return res.status(400).send({ message: "Content cannot be empty!" });
  }

  // Create an Article
  const article = new Article({
    title: req.body.title,
    slug: req.body.slug,
    description: req.body.description,
    content: req.body.content,
    imageId: req.body.imageId,
    category: req.body.category,
    status: req.body.status || "draft",
    isHighlighted: req.body.isHighlighted || false,
    author: req.body.author,
    date: req.body.date,
    location: req.body.location,
    publicationDate: req.body.publicationDate,
    commentsDisabled: req.body.commentsDisabled || false,
    embeddedVideoUrl: req.body.embeddedVideoUrl,
    keyPoints: req.body.keyPoints,
    priority: req.body.priority,
    destination: req.body.destination,
    validityHours: req.body.validityHours,
    tags: req.body.tags,
    articleType: req.body.articleType,
  });

  // Save Article in the database
  try {
    const data = await article.save();

    // Log action
    if (req.userId) {
      const log = new Log({
        user: req.userId,
        action: "ARTICLE_CREATED",
        details: `Article ${data._id} created`,
      });
      await log.save();
    }
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Article.",
    });
  }
};

// Retrieve all Articles from the database.
exports.getArticles = async (req, res) => {
  // For admins or own user's articles
  const { title, status, category, destination, author } = req.query;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const condition = {};

  if (title) {
    condition.title = { $regex: new RegExp(title), $options: "i" };
  }
  if (status) {
    condition.status = status;
  }
  if (category) {
    condition.category = category;
  }
  if (destination) {
    condition.destination = destination;
  }

  try {
    const requester = await User.findById(req.userId);

    // If user is not an admin, they can only see their own articles.
    if (!requester || !requester.isAdmin()) {
      condition.author = req.userId;
    } else if (author) {
      // Admin can filter by author
      condition.author = author;
    }

    const total = await Article.countDocuments(condition);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    let query = Article.find(condition)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // Sort by createdAt descending (newest first)
    if (requester && requester.isAdmin()) {
      query = query.populate("author", "name alias pictureUrl");
    }
    const articles = await await query;
    res.send({
      success: true,
      articles,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving articles.",
    });
  }
};

// Retrieve all public Articles from the database.
exports.getPublicArticles = async (req, res) => {
  const { title, category, destination } = req.query;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const condition = { status: "published" }; // Only published articles

  if (title) {
    condition.title = { $regex: new RegExp(title), $options: "i" };
  }
  if (category) {
    condition.category = category;
  }
  if (destination) {
    condition.destination = destination;
  }

  try {
    const total = await Article.countDocuments(condition);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    // Sort by priority descending, then by publicationDate descending
    const articles = await Article.find(condition)
      .sort({ priority: -1, publicationDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("author", "name alias pictureUrl");

    res.send({
      success: true,
      articles,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving public articles.",
    });
  }
};

// Find a single Article with an id
exports.getArticle = async (req, res) => {
  const id = req.params.id;

  try {
    let data;

    // Si parece un ObjectId válido, intentamos buscar por ID
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      data = await Article.findById(id);
    }

    // Si no se encontró (o no era un ID válido), buscamos por slug
    if (!data) {
      data = await Article.findOne({ slug: id });
    }

    if (!data)
      res.status(404).send({ message: "Not found Article with id " + id });
    else res.send(data);
  } catch (err) {
    res.status(500).send({ message: "Error retrieving Article with id=" + id });
  }
};

// Update an Article by the id in the request
exports.updateArticle = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  try {
    const data = await Article.findByIdAndUpdate(id, req.body, {
      useFindAndModify: false,
      new: true, // Returns the modified document
    });
    if (!data) {
      res.status(404).send({
        message: `Cannot update Article with id=${id}. Maybe Article was not found!`,
      });
    } else {
      // Log action
      if (req.userId) {
        const log = new Log({
          user: req.userId,
          action: "ARTICLE_UPDATED",
          details: `Article ${id} updated`,
        });
        await log.save();
      }
      res.send(data);
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Article with id=" + id,
    });
  }
};

// Delete an Article with the specified id in the request
exports.deleteArticle = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Article.findByIdAndDelete(id);
    if (!data) {
      res.status(404).send({
        message: `Cannot delete Article with id=${id}. Maybe Article was not found!`,
      });
    } else {
      // Log action
      if (req.userId) {
        const log = new Log({
          user: req.userId,
          action: "ARTICLE_DELETED",
          details: `Article ${id} deleted`,
        });
        await log.save();
      }
      res.send({
        message: "Article was deleted successfully!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Article with id=" + id,
    });
  }
};
