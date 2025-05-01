const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Signup Route
router.post("/signup", verifyFirebaseToken, async (req, res) => {
  const { name } = req.body;
  const { firebaseUid, firebaseEmail } = req;

  try {
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    user = new User({ firebaseUid, name, email: firebaseEmail });
    await user.save();

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(201).json({
      message: "User created successfully!",
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login Route
router.post("/users/login", verifyFirebaseToken, async (req, res) => {
  const { firebaseUid, firebaseEmail } = req;

  try {
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = new User({ firebaseUid, email: firebaseEmail, name: "<default>" });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
