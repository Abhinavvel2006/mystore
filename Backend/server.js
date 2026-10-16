require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const User = require("./model/user");
const Admin = require("./model/admin");
const Product = require("./model/product");
const Category = require("./model/category");
const Order = require("./model/order");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  }),
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

app.post("/api/register", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const existingUser = await User.findOne({ email });

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
      user: { email: newUser.email },
    });
  } catch (error) {
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or Password",
      });
    }

    res.json({
      success: true,
      message: "Login Successful",
      user: { email: user.email },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// admin section

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({
      email,
      password,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    res.json({
      success: true,
      message: "Welcome Admin",
      admin,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Products API
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.json({ success: true, product: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, product: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Categories API
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const c = new Category(req.body);
    await c.save();
    res.json({ success: true, category: c });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const c = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, category: c });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Orders API
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/orders/user/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const orders = await Order.find({
      $or: [{ userEmail: email }, { customer: email }],
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    console.log("Incoming Order:");
    console.log(req.body);

    const o = new Order(req.body);

    await o.save();

    res.json({
      success: true,
      order: o,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    const o = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, order: o });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill in all fields." });
    }

    const recipientEmail =
      process.env.CONTACT_TO ||
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "support@mystore.com";
    const senderEmail = email.trim();
    const fromAddress =
      process.env.SMTP_FROM || process.env.SMTP_USER || senderEmail;

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.warn("SMTP is not configured. Contact message was not sent.");
      return res.json({
        success: true,
        message:
          "Message received. Configure SMTP credentials to send it by email.",
      });
    }

    await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      replyTo: senderEmail,
      subject: `New Contact Message: ${subject}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    res.json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/google-login", async (req, res) => {
  try {
    const { name, email, provider } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        provider,
      });

      await user.save();
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
