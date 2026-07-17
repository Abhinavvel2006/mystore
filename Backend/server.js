const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let users = [];

app.post("/api/register", (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.json({
      success: false,
      message: "Passwords do not match",
    });
  }

  const existingUser = users.find(
    (user) => user.email === email
  );

  if (existingUser) {
    return res.json({
      success: false,
      message: "User already exists",
    });
  }

  users.push({ email, password });

  res.json({
    success: true,
    message: "Registration successful",
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (user) {
    return res.json({
      success: true,
      message: "Login successful",
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid email or password",
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});