const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Define User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  courseHistory: { type: mongoose.Schema.Types.ObjectId, ref: "CourseHistory" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);

// Define Course and CourseHistory Schema
const CourseSchema = new mongoose.Schema({
  programId: { type: String, required: true },
  description: { type: String, required: true },
  semester: { type: String, required: true },
  grade: { type: String, required: true, match: /^[A-F][+-]?$/ },
  credits: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Taken", "Transferred"], required: true },
});

const CourseHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courses: { type: [CourseSchema], required: true },
  createdAt: { type: Date, default: Date.now },
});

const CourseHistory = mongoose.model("CourseHistory", CourseHistorySchema);
app.get("/course-histories", async (req, res) => {
  try {
    const courseHistories = await CourseHistory.find().populate("userId"); // Fetch course histories

    if (!courseHistories || courseHistories.length === 0) {
      return res.status(404).json({ error: "No course history records found" });
    }

    res.status(200).json(courseHistories);
  } catch (err) {
    console.error("Error fetching course histories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User created successfully!",
      token,
      userId: newUser._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/submit-course-history", async (req, res) => {
  try {
    const { userId, courses } = req.body;

    if (!userId || !courses || courses.length === 0) {
      return res.status(400).json({ error: "Missing userId or courses" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let courseHistory = await CourseHistory.findOne({ userId });

    if (courseHistory) {
      courseHistory.courses = courses;
      await courseHistory.save();
      return res.status(200).json({
        message: "Course history updated successfully!",
        courseHistory,
      });
    } else {
      courseHistory = new CourseHistory({ userId, courses });
      await courseHistory.save();
      user.courseHistory = courseHistory._id;
      await user.save();
      return res.status(201).json({
        message: "Course history saved successfully!",
        courseHistory,
      });
    }
  } catch (err) {
    console.error("Error saving course history:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}); // ✅ Ensure this closing brace matches the function


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
