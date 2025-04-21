const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// CORS configuration for GitHub Pages
app.use(
  cors({
    origin: ["http://localhost:3000", "https://jeh333.github.io"],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Multer for PDF uploads
const upload = multer({ dest: "uploads/" });

// Define User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String }, // <-- Added this
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
  semester: { type: String, required: true },
  grade: {
    type: String,
    required: true,
    match: /^(A|A-|A\+|B|B-|B\+|C|C-|C\+|D|D-|D\+|F|W|IP)$/,
  },
  description: { type: String }, 
  credits: { type: Number, min: 0 }, 
  status: {
    type: String,
    enum: ["Taken", "Transferred"], 
  },
});


const CourseHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courses: { type: [CourseSchema], required: true },
  major: { type: String},
  createdAt: { type: Date, default: Date.now },
});

const CourseHistory = mongoose.model("CourseHistory", CourseHistorySchema);

// Define CourseList Schema and Model
const CourseListSchema = new mongoose.Schema({
  _id: String,
  program: String,
  description: String,
  Credits: String,
  Prerequisites: String
});
const CourseList = mongoose.model("CourseList", CourseListSchema, "CourseList");

// Routes
app.get("/courses/:programId", async (req, res) => {
  try {
    const course = await CourseList.findById(req.params.programId); 
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    console.error("Course lookup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/course-histories", async (req, res) => {
  try {
    const courseHistories = await CourseHistory.find().populate("userId");
    if (!courseHistories || courseHistories.length === 0) {
      return res.status(404).json({ error: "No course history records found" });
    }
    res.status(200).json(courseHistories);
  } catch (err) {
    console.error("Error fetching course histories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get full course catalog
app.get("/course-catalog", async (req, res) => {
  try {
    const allCourses = await CourseList.find({});
    res.json(allCourses);
  } catch (err) {
    console.error("Error fetching course catalog:", err);
    res.status(500).json({ error: "Failed to fetch course catalog" });
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
});


// PDF Upload Route
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const userId = req.body.userId;
    const file = req.file;

    if (!userId || !file) {
      return res.status(400).json({ error: "Missing userId or file" });
    }

    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;

    console.log("Extracted PDF text:\n", extractedText);

    const lines = extractedText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const courseRegex =
      /^([A-Z]{2}\d{2})\s+([A-Z_]+)\s+([\dA-Z]+)\s+([\d.]+)\s+([A-Z][+-]?|IP)\s+[A-Z]+\s+(.*)$/;

    const courses = [];

    for (const line of lines) {
      const match = line.match(courseRegex);
      if (match) {
        const [_, semester, subject, number, credits, grade, description] = match;

        if (grade === "W" || parseFloat(credits) === 0) continue;

        courses.push({
          programId: `${subject} ${number}`,
          semester,
          grade,
        });
      }
    }

    if (courses.length === 0) {
      return res.status(400).json({ error: "No valid courses found in PDF" });
    }

    let courseHistory = await CourseHistory.findOne({ userId });
    if (courseHistory) {
      courseHistory.courses = courses;
      await courseHistory.save();
    } else {
      courseHistory = new CourseHistory({ userId, courses });
      await courseHistory.save();

      const user = await User.findById(userId);
      if (user) {
        user.courseHistory = courseHistory._id;
        await user.save();
      }
    }

    fs.unlinkSync(file.path);

    return res.status(200).json({
      message: "PDF parsed and course history saved",
      courseCount: courses.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Error processing PDF upload" });
  }
});


app.post("/set-major", async (req, res) => {
  const { userId, major } = req.body;

  try {
    const updated = await CourseHistory.findOneAndUpdate(
      { userId },
      { major },
      { new: true, upsert: false }
    );

    if (!updated) {
      return res.status(404).json({ error: "Course history not found" });
    }

    res.json({ message: "Major updated successfully", updated });
  } catch (err) {
    console.error("Error setting major:", err);
    res.status(500).json({ error: "Failed to update major" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

