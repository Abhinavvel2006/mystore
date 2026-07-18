require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./model/user");
const Admin = require("./model/admin");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


app.post("/api/register", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const existingUser = await User.findOne({email});

    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }

    const newUser = new User({
      email,
      password,
    });

    await newUser.save();

    res.json({
      success: true,
      message: "Registration successful",
    });
  }
  catch(error){
    console.log(error);

  res.status(500).json({
    success: false,
    message: "Server Error",
  });
  }
});

app.post("/api/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      password,
  });

  if (!User) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or Password",
    });
  }

  res.json({
    success: true,
    message: "Login Successful",
  });
}
catch(error){
  console.log(error);

  res.status(500).json({
    success: false,
    message: "Server Error",
  });
}
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

// admin section 

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({
      email,
      password
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password"
      });
    }

    res.json({
      success: true,
      message: "Welcome Admin",
      admin
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});