const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PDFParser = require("pdf2json");
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

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  courseHistory: { type: mongoose.Schema.Types.ObjectId, ref: "CourseHistory" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);

const CourseListSchema = new mongoose.Schema({
  _id: String,
  program: String,
  description: String,
  Credits: String,
  Prerequisites: String
});

const Course = mongoose.model("Course", CourseListSchema, "CourseList");
// Define Course and CourseHistory Schema
const CourseSchema = new mongoose.Schema({
  programId: { type: String, required: true },
  semester: { type: String, required: true },
  grade: { type: String, required: true, match: /^[A-F][+-]?|W$/ },
  status: { type: String, enum: ["Taken", "Transferred"], required: true },
});

const CourseHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courses: { type: [CourseSchema], required: true },
  createdAt: { type: Date, default: Date.now },
});

const CourseHistory = mongoose.model("CourseHistory", CourseHistorySchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//PDF Parser only accepts the courses below for now, more needs to be added
const departments = ["Cmp Sc", "Infotc", "Nep", "Econom", "Math"];
// Routes
app.post("/upload", upload.single("pdf"), async (req, res) => {
  const userId = req.body.userId;

  if (!req.file || !userId) {
    console.error("Missing file or user ID");
    return res.status(400).json({ error: "File and user ID are required." });
  }

  const pdfParser = new PDFParser();
  pdfParser.parseBuffer(req.file.buffer);

  pdfParser.on("pdfParser_dataReady", async (pdfData) => {
    const text = extractTextFromPdfJson(pdfData);
    const parsedCourses = extractCourses(text);

    if (parsedCourses.length === 0) {
      return res.status(400).json({ error: "No valid courses found." });
    }

    const formattedCourses = parsedCourses.map(course => ({
      programId: course.departmentCourse,
      semester: course.term,
      grade: course.grade,
      status: "Taken"
    }));

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      let courseHistory = await CourseHistory.findOne({ userId });

      if (courseHistory) {
        courseHistory.courses.push(...formattedCourses);
        await courseHistory.save();
      } else {
        courseHistory = new CourseHistory({ userId, courses: formattedCourses });
        await courseHistory.save();
        user.courseHistory = courseHistory._id;
        await user.save();
      }

      res.json({ message: "Courses added to history!", courses: formattedCourses });
    } catch (err) {
      console.error("DB Error:", err);
      res.status(500).json({ error: "Failed to save courses." });
    }
  });

  pdfParser.on("pdfParser_dataError", err => {
    console.error("PDF Parsing Error:", err.parserError);
    res.status(500).json({ error: "Error parsing the PDF." });
  });
});

function extractTextFromPdfJson(pdfData) {
  return pdfData.Pages.map(page =>
    page.Texts.map(textObj => decodeURIComponent(textObj.R[0].T)).join(" ")
  ).join(" ");
}

function extractCourses(text) {
  const courses = [];
  const semesterRegex = /(FALL|SPNG|SUM)\s*(\d{4})\s*Local Campus Credits Ugrd[\s\S]*?(?=FALL|SPNG|SUM|\bMissouri Civics Examination\b|$)/g;

  let match;
  while ((match = semesterRegex.exec(text)) !== null) {
    let semester = `${match[1]} ${match[2]}`;
    let sectionText = match[0];

    console.log(`Found Semester Section: ${semester}`);
    console.log(`Extracted Section Text (First 300 chars):\n${sectionText.substring(0, 300)}\n`);

    let courseRegex = new RegExp(
      `(${departments.join("|")})\\s+(\\d{4}[WH]?)\\s+([A-Za-z &\\-\\d\/]+?)\\s+([A-FIPW][+-]?)\\s+(\\d+\\.\\d+)`,
      "g"
    );

    let courseMatch;
    let foundCourses = false;

    while ((courseMatch = courseRegex.exec(sectionText)) !== null) {
      foundCourses = true;

      let course = {
        term: semester,
        departmentCourse: `${courseMatch[1]} ${courseMatch[2]}`,
        title: courseMatch[3].replace(/\s+/g, " ").trim(),
        grade: courseMatch[4],
        credits: courseMatch[5]
      };

      console.log(`Matched Course:`, course);
      courses.push(course);
    }

    if (!foundCourses) {
      console.warn(`No valid courses found in ${semester}.`);
    }
  }

  return courses;
}

// Authentication and course history endpoints remain unchanged...
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
      {
        expiresIn: "1h",
      }
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
      {
        expiresIn: "1h",
      }
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

    for (const course of courses) {
      const normalizedId = course.programId.replace(/\u00A0/g, ' ').normalize("NFC").trim();
      const altId = normalizedId.replace(/ /g, '\u00A0');
      const exists = await Course.findOne({ $or: [
        { _id: normalizedId },
        { _id: altId }
      ]});
      if (!exists) {
        return res.status(400).json({ error: `Course ${normalizedId} not found.` });
      }
    }

    let courseHistory = await CourseHistory.findOne({ userId });

    if (courseHistory) {
      courseHistory.courses.push(...courses);
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

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
