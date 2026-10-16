const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    category: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: Date,
  },
  {
    timestamps: true,
    collection: "Expense",
    autoCreate: false,
    autoIndex: false,
    bufferCommands: false,
  },
);

module.exports = mongoose.model("Expense", ExpenseSchema);
