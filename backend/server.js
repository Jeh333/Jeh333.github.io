const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Firebase Admin Initialization
let serviceAccount;

if (process.env.FIREBASE_SERVICE_KEY) {
  // Running on Render / production
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);
} else {
  // Running locally
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://jeh333-github-io.onrender.com"],
    credentials: true,
  })
);
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Routes
app.use("/", authRoutes);
app.use("/", courseRoutes);

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
