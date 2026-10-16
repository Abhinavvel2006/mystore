const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, default: "" },
  name: String,
  qty: Number,
  price: Number,
});

const OrderSchema = new mongoose.Schema(
  {
    customer: { type: String, default: "Guest" },
    userEmail: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
    items: [OrderItemSchema],
    total: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    currency: { type: String, default: "INR" },
    amount: Number,
    subtotal: Number,
    shipping: Number,
    paymentProvider: String,
    paymentStatus: { type: String, enum: ["pending", "paid"] },
    paymentMethod: String,
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    checkoutId: { type: String, unique: true, sparse: true },
    checkoutFingerprint: String,
    paidAt: Date,
    inventoryStatus: { type: String, enum: ["deducted", "attention"] },
    inventoryIssues: { type: [String], default: undefined },
    effectsAppliedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", OrderSchema);
