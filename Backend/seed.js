require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./model/product");

const starterProducts = [
  {
    name: "Nike Footwear",
    price: 2.32,
    category: "Footwear",
    quantity: 25,
    image: "",
  },
  {
    name: "Adidas Footwear",
    price: 1.99,
    category: "Footwear",
    quantity: 30,
    image: "",
  },
  {
    name: "Wireless Mouse",
    price: 19.99,
    category: "Electronics",
    quantity: 50,
    image: "",
  },
  {
    name: "Mechanical Keyboard",
    price: 39.99,
    category: "Electronics",
    quantity: 20,
    image: "",
  },
  {
    name: "Cotton T-Shirt",
    price: 12.5,
    category: "Clothing",
    quantity: 100,
    image: "",
  },
  {
    name: "Denim Jacket",
    price: 45.0,
    category: "Clothing",
    quantity: 15,
    image: "",
  },
  {
    name: "Modern Chair",
    price: 45.99,
    category: "Home",
    quantity: 10,
    image: "",
  },
  {
    name: "Glass Table",
    price: 89.0,
    category: "Home",
    quantity: 8,
    image: "",
  },
  {
    name: "Smartphone X",
    price: 299.99,
    category: "Mobile",
    quantity: 12,
    image: "",
  },
  {
    name: "Smartphone Lite",
    price: 149.99,
    category: "Mobile",
    quantity: 18,
    image: "",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const count = await Product.countDocuments();

    if (count === 0) {
      await Product.insertMany(starterProducts);
      console.log("Starter products inserted.");
    } else {
      console.log("Products already exist. Seed skipped.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
