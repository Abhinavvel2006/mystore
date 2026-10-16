const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    category: { type: String },
    quantity: { type: Number, default: 0 },
    inventoryOrderIds: { type: [String], select: false, default: undefined },
    image: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
