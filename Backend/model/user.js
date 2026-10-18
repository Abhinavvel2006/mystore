const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "",
  },

  email: {
    type: String,
  },

  password: {
    type: String,
    default: "",
    select: false,
  },

  provider: {
    type: String,
    default: "manual",
  },
  uid: { type: String },
  photoURL: { type: String, default: "" },
  phone: { type: String, default: "" },
  age: { type: Number, default: null, min: 1, max: 120 },
  location: { type: String, default: "", maxlength: 120 },
  deliveryAddress: { type: String, default: "", maxlength: 500 },
  paymentMethod: {
    type: String,
    enum: ["", "upi", "card", "netbanking", "wallet", "emi", "paylater"],
    default: "",
  },
}, { autoIndex: false });

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ uid: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
