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
    items: [OrderItemSchema],
    total: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", OrderSchema);
