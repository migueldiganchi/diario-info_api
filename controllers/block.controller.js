const Block = require("../models/block.model.js");
const BlockTemplate = require("../models/blockTemplate.model.js");

// Retrieve all Block Templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await BlockTemplate.find();
    res.send({ templates });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving templates.",
    });
  }
};

// Create and Save a new Block Template
exports.createTemplate = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({ message: "Content cannot be empty!" });
  }

  const { name, code, description, icon, layout, columns, previewUrl, schema } =
    req.body;

  const template = new BlockTemplate({
    name,
    code,
    description,
    icon,
    layout,
    columns,
    previewUrl,
    schema,
  });

  try {
    const data = await template.save();
    res.status(201).send({ template: data });
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Block Template.",
    });
  }
};

// Update a Block Template
exports.updateTemplate = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await BlockTemplate.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!data) {
      res.status(404).send({
        message: `Cannot update Block Template with id=${id}. Maybe it was not found!`,
      });
    } else {
      res.send({ template: data });
    }
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error updating Block Template with id=" + id });
  }
};

// Delete a Block Template
exports.deleteTemplate = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await BlockTemplate.findByIdAndDelete(id);
    if (!data) {
      res.status(404).send({
        message: `Cannot delete Block Template with id=${id}. Maybe it was not found!`,
      });
    } else {
      res.send({ message: "Block Template was deleted successfully!" });
    }
  } catch (err) {
    res
      .status(500)
      .send({ message: "Could not delete Block Template with id=" + id });
  }
};

// Retrieve all Blocks from the database
exports.getBlocks = async (req, res) => {
  try {
    // Get blocks sorted by 'order' field
    const blocks = await Block.find().sort({ order: 1 }).populate("template");

    // NOTE: If you need the backend to resolve articles (populate)
    // based on configuration (config.categoryId, config.tagId, etc.),
    // you should import the Article model and process each block here.
    // For now, we return the configuration as is.

    res.send({ blocks });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving blocks.",
    });
  }
};

// Create and Save a new Block
exports.createBlock = async (req, res) => {
  // Validate request
  if (!req.body) {
    return res.status(400).send({ message: "Content cannot be empty!" });
  }

  const { name, template, order, isVisible, config } = req.body;

  // Create a Block
  const block = new Block({
    name,
    template,
    order: order ?? 0,
    isVisible: isVisible ?? true,
    config,
  });

  // Save Block in the database
  try {
    await block.save();
    // Populate the template to return the full object
    await block.populate("template");

    res.status(201).send({ block });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Block.",
    });
  }
};

// Update a Block by the id in the request
exports.updateBlock = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  try {
    const data = await Block.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate("template");

    if (!data) {
      res.status(404).send({
        message: `Cannot update Block with id=${id}. Maybe Block was not found!`,
      });
    } else {
      res.send({ block: data });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Block with id=" + id,
    });
  }
};

// Delete a Block with the specified id in the request
exports.deleteBlock = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Block.findByIdAndDelete(id);
    if (!data) {
      res.status(404).send({
        message: `Cannot delete Block with id=${id}. Maybe Block was not found!`,
      });
    } else {
      res.send({
        message: "Block was deleted successfully!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Block with id=" + id,
    });
  }
};

// Reorder Blocks
exports.reorderBlocks = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).send({ message: "An array of IDs is required" });
    }

    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index },
      },
    }));

    if (bulkOps.length > 0) {
      await Block.bulkWrite(bulkOps);
    }

    res.send({ message: "Order updated successfully" });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error reordering blocks",
    });
  }
};
