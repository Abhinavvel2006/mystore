const mongoose = require("mongoose");

const superadminSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        default: "superadmin",
    }
});

module.exports = mongoose.model("Admin", superadminSchema);