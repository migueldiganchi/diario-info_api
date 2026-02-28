const Category = require("../models/category.model.js");
const Log = require("../models/log.model.js");

const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

// Create and Save a new Category
exports.createCategory = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).send({ message: "Name can not be empty!" });
  }

  const { name, description, color, parent, slug } = req.body;

  // Auto-generate slug if not provided
  const finalSlug = slug || generateSlug(name);

  const category = new Category({
    name,
    slug: finalSlug,
    description,
    color,
    parent: parent || null,
  });

  try {
    const data = await category.save();

    if (req.userId) {
      const log = new Log({
        user: req.userId,
        action: "CATEGORY_CREATED",
        details: `Category ${data.name} (${data._id}) created`,
      });
      await log.save();
    }

    res.status(201).send({ success: true, category: data });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key
      return res
        .status(409)
        .send({ message: "A category with that name or slug already exists." });
    }
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Category.",
    });
  }
};

// Retrieve all Categories from the database.
exports.getCategories = async (req, res) => {
  const { search, parent } = req.query;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const condition = { disabledAt: null }; // Only active categories

  if (search) {
    const searchRegex = new RegExp(search, "i");
    condition.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  if (parent) {
    if (parent === "null") {
      condition.parent = null;
    } else {
      condition.parent = parent;
    }
  }

  try {
    const total = await Category.countDocuments(condition);
    const categories = await Category.find(condition)
      .populate("parent", "name slug")
      .sort({ name: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page < totalPages ? page + 1 : null;

    res.send({
      success: true,
      categories,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving categories.",
    });
  }
};

// Find a single Category with an id or slug
exports.getCategory = async (req, res) => {
  const id = req.params.id;

  try {
    let data;
    // Check if it's a valid ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      data = await Category.findById(id).populate("parent", "name slug");
    }

    // If not found by ID, try by slug
    if (!data) {
      data = await Category.findOne({ slug: id }).populate(
        "parent",
        "name slug",
      );
    }

    if (!data)
      res
        .status(404)
        .send({ message: "Not found Category with identifier " + id });
    else res.send({ success: true, category: data });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error retrieving Category with identifier=" + id });
  }
};

// Update a Category by the id in the request
exports.updateCategory = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  const updateData = { ...req.body };
  // if name is updated, slug should be updated too, if slug is not sent
  if (updateData.name && !updateData.slug) {
    updateData.slug = generateSlug(updateData.name);
  }

  try {
    const data = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!data) {
      res.status(404).send({
        message: `Cannot update Category with id=${id}. Maybe Category was not found!`,
      });
    } else {
      if (req.userId) {
        const log = new Log({
          user: req.userId,
          action: "CATEGORY_UPDATED",
          details: `Category ${data.name} (${id}) updated`,
        });
        await log.save();
      }
      res.send({ success: true, category: data });
    }
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key
      return res
        .status(409)
        .send({ message: "A category with that name or slug already exists." });
    }
    res.status(500).send({
      message: "Error updating Category with id=" + id,
    });
  }
};

// Soft delete a Category (set disabledAt)
exports.deleteCategory = async (req, res) => {
  const id = req.params.id;

  try {
    // TODO: Check if category is in use by articles before deleting.
    const data = await Category.findByIdAndUpdate(
      id,
      { disabledAt: new Date() },
      { new: true },
    );
    if (!data) {
      res.status(404).send({
        message: `Cannot delete Category with id=${id}. Maybe Category was not found!`,
      });
    } else {
      if (req.userId) {
        const log = new Log({
          user: req.userId,
          action: "CATEGORY_DELETED",
          details: `Category ${data.name} (${id}) disabled`,
        });
        await log.save();
      }
      res.send({
        success: true,
        message: "Category was disabled successfully!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not disable Category with id=" + id,
    });
  }
};
