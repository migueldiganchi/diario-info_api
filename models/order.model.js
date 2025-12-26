const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  items: [
    {
      _id: false,
      imageUrl: String,
      title: String,
      description: String,
      price: Number,
      discount: Number,
      quantity: Number,
      publication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Publication",
      },
    },
  ],
  totalAmount: Number,
  status: String, // ('pending', 'sent', 'delivered', 'canceled')
  data: {
    preferenceId: String,
    preferencedAt: Date,
    paymentId: String,
  },
  payedAt: { type: Date, default: null },
  createdAt: { type: Date, default: null },
});

let orderModel = null;

try {
  orderModel = mongoose.model("Order");
} catch (error) {
  orderModel = mongoose.model("Order", orderSchema);
}

module.exports = orderModel;
