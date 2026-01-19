const Article = require("../models/article.model.js");

// Create and Save a new Article
exports.createArticle = async (req, res) => {
  // Validate request
  if (!req.body.title) {
    return res.status(400).send({ message: "Content can not be empty!" });
  }

  // Create an Article
  const article = new Article({
    title: req.body.title,
    description: req.body.description,
    content: req.body.content,
    contentBlocks: req.body.contentBlocks,
    imageId: req.body.imageId,
    category: req.body.category,
    status: req.body.status,
    isHighlighted: req.body.isHighlighted,
    author: req.body.author || req.userId, // Asigna el usuario autenticado si está disponible
    articleDate: req.body.articleDate,
    commentsDisabled: req.body.commentsDisabled,
    priority: req.body.priority,
    destination: req.body.destination,
    validityHours: req.body.validityHours,
    tags: req.body.tags,
    articleType: req.body.articleType,
  });

  // Save Article in the database
  try {
    const data = await article.save();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Article.",
    });
  }
};

// Retrieve all Articles from the database.
exports.getArticles = async (req, res) => {
  const { title, status, category, destination } = req.query;
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
    // Ordenamos por articleDate descendente (lo más nuevo primero)
    const data = await Article.find(condition).sort({ articleDate: -1 });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving articles.",
    });
  }
};

// Find a single Article with an id
exports.getArticle = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Article.findById(id);
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
      new: true, // Devuelve el documento modificado
    });
    if (!data) {
      res.status(404).send({
        message: `Cannot update Article with id=${id}. Maybe Article was not found!`,
      });
    } else res.send(data);
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
