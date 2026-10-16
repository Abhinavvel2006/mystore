const mongoose = require("mongoose");

const RevenueSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    source: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: Date,
    orderId: String,
    currency: String,
    paymentMethod: String,
    razorpayPaymentId: String,
  },
  {
    timestamps: true,
    collection: "Revenue",
    autoCreate: false,
    autoIndex: false,
    bufferCommands: false,
  },
);

module.exports = mongoose.model("Revenue", RevenueSchema);
