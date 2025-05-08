const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

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

    return res.status(201).json({
      message: "User created successfully!",
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

    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
    });
    
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
