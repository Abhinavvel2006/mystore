const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "",
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    default: "",
  },

  provider: {
    type: String,
    default: "manual",
  },
});

module.exports = mongoose.model("User", userSchema);
