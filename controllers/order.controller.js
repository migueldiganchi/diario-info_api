const mongoose = require("mongoose");
const Order = mongoose.model("Order"); // Make sure your model is named "Order"

exports.getPurchases = async (req, res) => {
  const page = Math.max(1, req.query.page || 1);
  const pageSize = Math.max(1, req.query.pageSize || 10);
  const term = req.query.term || "";
  const termRegex = new RegExp(term, "i"); // "i" for case-insensitive search
  const authenticatedUserId = req.userId;
  const queryConditions = {
    payer: authenticatedUserId, // Assume req.user contains the current user's information
    // status: "1", // Filter purchases with status "1"
  };

  // Apply term filter
  if (term !== "") {
    queryConditions["$or"] = [
      { "items.publication.title": termRegex },
      { "items.publication.description": termRegex },
    ];
  }

  try {
    const purchases = await Order.find(queryConditions)
      .populate(
        "payer seller",
        "_id name phone locationAddress locationCountry locationCity pictureUrl"
      )
      .populate(
        "items.publication",
        "_id title description price discount files"
      ) // Load publication data in items
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .exec();

    const total = await Order.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / pageSize);
    const nextPage = page < totalPages ? page + 1 : null;

    return res.status(200).json({
      success: true,
      purchases,
      total,
      totalPages,
      nextPage,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      message: err.message || "Something went wrong while fetching purchases.",
    });
  }
};

exports.getPurchase = async (req, res) => {
  const authenticatedUserId = req.userId;
  const orderId = req.params.orderId;

  try {
    const purchase = await Order.findOne({
      _id: orderId,
      payer: authenticatedUserId,
    })
      .populate(
        "payer seller",
        "_id name phone locationAddress locationCountry locationCity pictureUrl"
      )
      .populate(
        "items.publication",
        "_id title description price discount files"
      ); // Load publication data in items

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    return res.status(200).json({
      success: true,
      purchase,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      message:
        err.message || "Something went wrong while fetching the purchase.",
    });
  }
};

exports.getSales = async (req, res) => {
  const authenticatedUserId = req.userId; // Assume req.userId contains the ID of the authenticated user

  try {
    const sales = await Order.find({
      seller: authenticatedUserId, // Filter sales where you are the seller
      // status: "1", // Filter sales with status "1"
    })
      .populate(
        "payer seller",
        "_id name phone locationAddress locationCountry locationCity pictureUrl"
      )
      .populate("items.publication", "_id title description"); // Load publication data in items

    return res.status(200).json({
      success: true,
      sales,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      message: err.message || "Something went wrong while fetching sales.",
    });
  }
};

exports.getSale = async (req, res) => {
  const authenticatedUserId = req.userId; // Assume req.userId contains the ID of the authenticated user
  const saleId = req.params.saleId; // Assume the sale ID is passed as a parameter in the URL

  try {
    const sale = await Order.findOne({
      _id: saleId,
      seller: authenticatedUserId, // Filter the sale where you are the seller
    })
      .populate(
        "payer seller",
        "_id name phone locationAddress locationCountry locationCity pictureUrl"
      )
      .populate(
        "items.publication",
        "_id title description price discount files"
      ); // Load publication data in items

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    return res.status(200).json({
      success: true,
      sale,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      message: err.message || "Something went wrong while fetching the sale.",
    });
  }
};
