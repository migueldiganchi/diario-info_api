const express = require("express");
const orderController = require("../controllers/order.controller");
const router = express.Router();

// GET Purchases
router.get("/purchases", [], orderController.getPurchases);

// GET Purchase/:id
router.get("/purchase/:orderId", [], orderController.getPurchase);

// GET Orders
router.get("/sales", [], orderController.getSales);

// GET Order/:id
router.get("/sale/:orderId", [], orderController.getSale);

module.exports = router;
