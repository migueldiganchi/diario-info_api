const Publication = require("../models/publication.model.js");
const User = require("../models/user.model.js");

exports.getPublications = async (req, res) => {
  const page = Math.max(0, req.query.page);
  const pageSize = Math.max(0, req.query.pageSize);
  const typed = req.query.typed ? req.query.typed : "";
  const country = req.query.country ? req.query.country : "";
  const city = req.query.city ? req.query.city : "";
  const term = req.query.term ? req.query.term : "";
  const termRegex = new RegExp(term, "i"); // i for case insensitive
  const queryConditions = {};
  const queryUserConditions = {};

  let userIds = [];

  // Typed Filter
  if (typed != "") {
    queryConditions["typed"] = typed;
  }

  // Term Filter
  if (term != "") {
    queryConditions["$or"] = [{ title: termRegex }, { description: termRegex }];
  }

  // Location Country & City Filters
  if (country != "" || city != "") {
    if (country != "") {
      queryUserConditions["locationCountry"] = country;
    }

    if (city != "") {
      queryUserConditions["locationCity"] = city;
    }

    userIds = await User.find(queryUserConditions).distinct("_id");

    queryConditions["createdBy"] = {
      $in: userIds,
    };
  }

  // Publication Status Filter
  queryConditions["status"] = "1";

  try {
    const publications = await Publication.find(queryConditions)
      .populate({
        path: "createdBy",
        model: "User",
        select:
          "_id name alias bio phone locationAddress locationCountry locationCity pictureUrl",
      })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .exec();
    const total = await Publication.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    return res.status(200).json({
      success: true,
      publications,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    console.info("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while fetching all publications.",
    });
  }
};

exports.getPublicationsByOwner = async (req, res) => {
  const authenticatedUserId = req.userId;
  const page = Math.max(0, req.query.page);
  const pageSize = Math.max(0, req.query.pageSize);
  const typed = req.query.typed ? req.query.typed : "";
  const term = req.query.term ? req.query.term : "";
  const termRegex = new RegExp(term, "i"); // i for case insensitive
  const authenticatedUser = await User.findById(authenticatedUserId);
  const queryConditions = {};

  // Check for authenticated user
  if (!authenticatedUser) {
    return res.status(404).send({
      message: "User was not found",
    });
  }

  // Check if it is a Super User
  if (!authenticatedUser.isSuperUser) {
    queryConditions["createdBy"] = authenticatedUserId;
  }

  // Typed Filter
  if (typed != "") {
    queryConditions["typed"] = typed;
  }

  // Term Filter
  if (term != "") {
    queryConditions["$or"] = [
      { title: termRegex },
      { description: termRegex },
      { locationAddress: termRegex },
    ];
  }

  // Applying Filters
  try {
    const myPublications = await Publication.find(queryConditions)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .populate("createdBy", "-password");
    const total = await Publication.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page + 1 <= totalPages ? page + 1 : null;

    res.status(200).json({
      success: true,
      publications: myPublications,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    console.info("[err]", err);
    return res.status(500).send({
      message:
        err.message ||
        "Something went wrong while fetching owner publications.",
    });
  }
};

exports.getPublication = async (req, res) => {
  const publicationId = req.params.id;

  try {
    const publication = await Publication.findById(publicationId).populate(
      "createdBy category",
      "_id name alias bio pictureUrl locationAddress locationCountry locationCity paymentDetails"
    );
    return res.status(200).json({
      success: true,
      publication: publication,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while fetching all publications.",
    });
  }
};

exports.createPublication = async (req, res) => {
  const authenticatedUserId = req.userId;
  const {
    typed,
    kind,
    categories,
    title,
    description,
    calendarAt,
    status,
    measureUnit,
    measureQuantity,
    stock,
    price,
    discount,
    locationUrl,
    locationAddress,
    labels,
    files,
    categoryId,
  } = req.body;

  const newPublication = new Publication({
    typed: typed,
    kind: kind,
    categories: categories,
    title: title,
    description: description,
    calendarAt: calendarAt,
    createdAt: Date.now(),
    status: status,
    measureUnit: measureUnit,
    measureQuantity: measureQuantity,
    stock: stock,
    price: price,
    discount: discount,
    locationUrl: locationUrl,
    locationAddress: locationAddress,
    files: files,
    createdBy: authenticatedUserId,
    labels: labels,
    categoryId: categoryId,
    status: 1,
  });

  try {
    const createdPublication = await newPublication.save();

    res.status(201).json({
      success: true,
      message: "Publication was created successfully",
      publication: createdPublication,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while creating the Publication.",
    });
  }
};

exports.updatePublication = async (req, res) => {
  const publicationId = req.params.id;
  const {
    typed,
    kind,
    categories,
    title,
    description,
    calendarAt,
    measureUnit,
    measureQuantity,
    stock,
    price,
    discount,
    locationUrl,
    labels,
    locationAddress,
    status,
    files,
    categoryId,
  } = req.body;

  try {
    const publicationToUpdate = await Publication.findById(publicationId);

    publicationToUpdate.typed = typed;
    publicationToUpdate.kind = kind;
    publicationToUpdate.categories = categories;
    publicationToUpdate.title = title;
    publicationToUpdate.description = description;
    publicationToUpdate.calendarAt = calendarAt;
    publicationToUpdate.updatedAt = Date.now();
    publicationToUpdate.status = status;
    publicationToUpdate.measureUnit = measureUnit;
    publicationToUpdate.measureQuantity = measureQuantity;
    publicationToUpdate.stock = stock;
    publicationToUpdate.price = price;
    publicationToUpdate.discount = discount;
    publicationToUpdate.labels = labels;
    publicationToUpdate.locationUrl = locationUrl;
    publicationToUpdate.locationAddress = locationAddress;
    publicationToUpdate.files = files;
    publicationToUpdate.categoryId = categoryId;
    publicationToUpdate.status = 1;

    const updatedPublication = await publicationToUpdate.save();

    return res.status(201).json({
      success: true,
      message: "Publication was updated successfully",
      publication: updatedPublication,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while updating the Publication.",
    });
  }
};

exports.removePublication = async (req, res) => {
  const publicationId = req.params.id;

  try {
    const removedPublication = await Publication.findByIdAndRemove(
      publicationId
    );
    res.status(201).json({
      success: true,
      message: "Publication removed successfully",
      removedPublication,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while removing the Publication.",
    });
  }
};
