const mercadopago = require("mercadopago");

const User = require("../models/user.model.js");
const Order = require("../models/order.model.js");

// Private Methods
const getMainImageUrl = (publication) => {
  return publication.files[0]?.url || null;
};

// Payments
exports.pay = async (req, res) => {
  const { newOrder } = req.body;
  const { seller } = newOrder;
  const payerUserId = req.userId;
  const payerUser = await User.findById(payerUserId);
  const ownerUser = await User.findById(seller).populate("seller");
  const ownerUserSeller = ownerUser.seller;

  let validationMessage = null;

  if (!newOrder.items?.length) {
    validationMessage = "Need items to pay";
  } else if (!payerUser) {
    validationMessage = "Need a payer";
  } else if (!ownerUser || !ownerUserSeller) {
    validationMessage = "Need an account seller to pay";
  } else if (payerUser._id === ownerUser._id) {
    validationMessage = "You cannot buy or sell yourself";
  }

  if (validationMessage) {
    return res.status(500).send({
      message: validationMessage,
    });
  }

  // Marketplace Setup
  mercadopago.configure({
    access_token: ownerUserSeller.marketplaceAccessToken,
  });

  try {
    // Create new Order
    const order = new Order(newOrder);

    // Set Order Creation Date
    order.createdAt = Date.now();

    // Save Order
    const savedOrder = await order.save();

    // Get Order From Database
    const orderFromDatabase = await Order.findById(savedOrder._id).populate(
      "items.publication"
    );

    // Prepare Publication Items
    const marketplaceOrderItems = [];
    orderFromDatabase.items.forEach((item) => {
      const { publication, quantity } = item;
      const { title } = publication;

      // Publication Freeze
      item.imageUrl = getMainImageUrl(publication);
      item.title = publication.title;
      item.description = publication.description;
      item.price = publication.price;
      item.discount = publication.discount;
      item.quantity = quantity;

      // Marketplace Order Items
      marketplaceOrderItems.push({
        title,
        unit_price: publication.price,
        quantity,
        currency_id: "ARS",
      });
    });

    // Callback URL's for Complete Payment Process
    const paymentNotificationsBaseURL =
      process.env.API_URL || "https://obras-api.ciudadbotica.com";
    const paymentNotificationsURI = `${paymentNotificationsBaseURL}/payment/news`;
    const afterPaymentURL = `${process.env.APP_BASE_URL}/dashboard/purchases/${orderFromDatabase._id}`;

    // Preference Setup
    const preference = {
      items: marketplaceOrderItems,
      payer: {
        name: payerUser.name,
        lastName: payerUser.lastName,
        email: payerUser.email,
      },
      marketplace: process.env.MERCADOPAGO_APP_ID,
      marketplace_fee: 3,
      binary_mode: true,
      notification_url: paymentNotificationsURI,
      back_urls: {
        success: `${afterPaymentURL}/success`,
        failure: `${afterPaymentURL}/failure`,
        pending: `${afterPaymentURL}/pending`,
      },
      payment_methods: {
        excluded_payment_types: [
          {
            id: "ticket",
          },
        ],
        installments: 12,
      },
      auto_return: "approved",
      external_reference: orderFromDatabase._id.toString(),
    };

    mercadopago.preferences
      .create(preference)
      .then(async function (data) {
        // Update Payment Data to Track In the Payment Result
        orderFromDatabase.data.preferenceId = data.body.id;
        orderFromDatabase.data.preferencedAt = Date.now();
        await orderFromDatabase.save();

        return res.status(200).json({
          success: true,
          preferenceId: data.body.id,
          preferenceInitPoint: data.body.init_point,
        });
      })
      .catch(function (err) {
        console.error("[err]", err);
        return res.status(500).send({
          message:
            err.message ||
            "Something went wrong while create payment preference",
        });
      });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message: err.message || "Something went wrong while fetch user data.",
    });
  }
};

// Save
exports.save = async (req, res) => {
  const { sellerId, paymentAppStatus } = req.body;
  const payerUserId = req.userId;

  try {
    const payerUser = await User.findById(payerUserId);
    const ownerUser = await User.findById(sellerId).populate("seller");
    const ownerUserSeller = ownerUser.seller;

    let validationMessage = null;

    // Request validations
    if (!payerUser) {
      validationMessage = "Need a payer";
    } else if (!ownerUser || !ownerUserSeller) {
      validationMessage = "Need seller to pay";
    } else if (payerUser._id.toString() === ownerUser._id.toString()) {
      validationMessage = "You cannot buy or sell to yourself";
    }

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    let savedOrder = null;
    let paymentMessage = "";

    // Handle payment status
    switch (paymentAppStatus) {
      case "success":
        // Check if the order has already been paid
        const order = await Order.findOne({
          seller,
          payer: payerUserId,
          status: "paid",
        });

        if (order) {
          savedOrder = { ...order.toObject() };
          paymentMessage = `The payment was already registered successfully on ${order.payedAt}`;
        } else {
          // Update order status to "paid"
          const updatedOrder = await Order.findOneAndUpdate(
            { seller, payer: payerUserId, status: "pending" },
            { status: "paid", payedAt: Date.now() },
            { new: true }
          );

          if (updatedOrder) {
            savedOrder = { ...updatedOrder.toObject() };
            paymentMessage = "The payment has been successfully registered";
          }
        }
        break;

      case "failure":
        // Handle payment failure
        paymentMessage = "Payment failed. Order status remains pending";
        break;

      case "pending":
        // Handle pending payment (optional)
        paymentMessage = "Payment is pending. Order status remains pending";
        break;

      default:
        // Handle other payment statuses (if needed)
        paymentMessage = `Payment status "${paymentAppStatus}" not handled`;
        break;
    }

    // Return payment status to show at frontend webhook
    return res.status(201).json({
      message: paymentMessage,
      paymentStatus: paymentAppStatus,
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error handling payment:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Something went wrong while handling the payment",
    });
  }
};

// Payment Notifications
exports.handleNotification = async (req, res) => {
  try {
    // Get notification data from MercadoPago
    const paymentId = req.body.data.id; // Payment ID from MercadoPago

    // Make an API request to MercadoPago to get payment status
    const paymentInfo = await mercadopago.payment.get(paymentId);

    console.log("[mercadopago.payment.paymentInfo]", paymentInfo);

    // Check payment status and take actions accordingly
    if (paymentInfo.status === "approved") {
      // Payment was approved, you can update your order status, send emails, etc.
      const orderId = paymentInfo.order.id; // Assuming the notification includes the order ID

      // Update the order status in your database
      await Order.findByIdAndUpdate(orderId, { status: "paid" });

      // Perform other actions according to your business logic
    } else {
      // Payment was not approved, handle it according to your needs
      const orderId = paymentInfo.external_reference; // Get the order ID from external_reference

      // Update the order status in your database as "unpaid" or any other status you prefer
      await Order.findByIdAndUpdate(orderId, { status: "unpaid" });

      // Additional actions for unapproved payments, such as sending notifications, logging, etc.
      // You can customize this part based on your requirements
      console.error("Payment not approved. Order ID: ", orderId);
    }

    // Respond with success to MercadoPago
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error handling payment notification:", err);
    res.status(500).json({
      success: false,
      error:
        err.message ||
        "Something went wrong while handling Mercado Pago Payment Notification",
    });
  }
};
