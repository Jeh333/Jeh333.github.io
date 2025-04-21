const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//Middleware to verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const idToken = match[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUid   = decodedToken.uid;
    req.firebaseEmail = decodedToken.email;
    next();
  } catch (err) {
    console.error("Firebase token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

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
  firebaseUid:   { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  // password is managed by Firebase now—no need to store it:
  // password:    { type: String },
  courseHistory: { type: mongoose.Schema.Types.ObjectId, ref: "CourseHistory" },
  createdAt:     { type: Date, default: Date.now },
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
  firebaseUid: { type: String, ref: "User", required: true }, // Reference Firebase UID instead of ObjectId
  courses: { type: [CourseSchema], required: true },
  major: { type: String, required: true },
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


// SIGNUP ROUTE
app.post("/signup", verifyFirebaseToken, async (req, res) => {
  const { name } = req.body;
  const { firebaseUid, firebaseEmail } = req;
  console.log("▶︎ /signup hit, body:", req.body);
  console.log("   firebaseUid:", req.firebaseUid, "email:", req.firebaseEmail);

  try {
    // Check if the user already exists
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user document
    user = new User({
      firebaseUid,
      name,
      email: firebaseEmail,
      // note: no password field needed
    });
    await user.save();

    // Generate your backend JWT
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });

    // Return success
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

// LOGIN ROUTE
app.post("/users/login", verifyFirebaseToken, async (req, res) => {
  const { firebaseUid, firebaseEmail } = req;

  try {
    // Try to find existing user
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      // If none, create one
      user = new User({
        firebaseUid,
        email: firebaseEmail,
        name: "<default or blank>", 
      });
      await user.save();
    }

    // Generate your backend JWT
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });

    // Return success
    return res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/submit-course-history", async (req, res) => {
  try {
    const { firebaseUid, courses } = req.body;

    if (!firebaseUid || !courses || courses.length === 0) {
      return res.status(400).json({ error: "Missing firebaseUid or courses" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ error: "User not found" });

    let courseHistory = await CourseHistory.findOne({ userId: user._id });

    if (courseHistory) {
      courseHistory.courses = courses;
      await courseHistory.save();
      return res.status(200).json({
        message: "Course history updated successfully!",
        courseHistory,
      });
    } else {
      courseHistory = new CourseHistory({ userId: user._id, courses });
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


app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const firebaseUid = req.body.firebaseUid;
    const file = req.file;

    if (!firebaseUid || !file) {
      return res.status(400).json({ error: "Missing firebaseUid or file" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ error: "User not found" });

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

    let courseHistory = await CourseHistory.findOne({ userId: user._id });
    if (courseHistory) {
      courseHistory.courses = courses;
      await courseHistory.save();
    } else {
      courseHistory = new CourseHistory({ userId: user._id, courses });
      await courseHistory.save();

      user.courseHistory = courseHistory._id;
      await user.save();
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

