const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const CourseList = require("../models/CourseList");
const CourseHistory = require("../models/CourseHistory");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");


const upload = multer({ dest: "uploads/" });

// Get single course by ID
router.get("/courses/:programId", async (req, res) => {
  try {
    const decodedProgramId = decodeURIComponent(req.params.programId).trim();
    const course = await CourseList.findById(decodedProgramId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    console.error("Course lookup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all course histories
router.get("/course-histories", async (req, res) => {
  try {
    const courseHistories = await CourseHistory.find();
    if (!courseHistories.length) {
      return res.status(404).json({ error: "No course histories found" });
    }
    res.json(courseHistories);
  } catch (err) {
    console.error("Error fetching histories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload PDF and parse courses
router.post(
  "/upload",
  verifyFirebaseToken,
  upload.single("pdf"),
  async (req, res) => {
    try {
      const firebaseUid = req.firebaseUid;
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      const lines = pdfData.text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const courseRegex =
        /^([A-Z]{2}\d{2})\s+([A-Z_]+)\s+([\dA-Z]+)\s+([\d.]+)\s+([A-Z][+-]?|IP|S)\s+[A-Z]+\s+(.*)$/;
      const courses = [];
      for (const line of lines) {
        const match = line.match(courseRegex);
        if (match) {
          const [, semester, subject, number, credits, grade] = match;
          if (grade === "W" || parseFloat(credits) === 0) continue;
          courses.push({ programId: `${subject} ${number}`, semester, grade });
        }
      }

      if (courses.length === 0) {
        return res.status(400).json({ error: "No valid courses found in PDF" });
      }

      let courseHistory = await CourseHistory.findOne({ firebaseUid });
      if (courseHistory) {
        courseHistory.courses = courses;
        await courseHistory.save();
      } else {
        courseHistory = await CourseHistory.create({ firebaseUid, courses });
      }

      fs.unlinkSync(file.path);
      return res
        .status(200)
        .json({
          message: "PDF parsed and course history saved",
          courseCount: courses.length,
        });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Error processing PDF upload" });
    }
  }
);

// Submit course history manually
router.post("/submit-course-history", verifyFirebaseToken, async (req, res) => {
  const { courses } = req.body;
  const firebaseUid = req.firebaseUid;

  if (!Array.isArray(courses) || !courses.length) {
    return res.status(400).json({ error: "Missing courses" });
  }

  try {
    let hist = await CourseHistory.findOne({ firebaseUid });
    if (hist) {
      hist.courses = courses;
      await hist.save();
      res.json({ message: "Course history updated", courseHistory: hist });
    } else {
      hist = await CourseHistory.create({ firebaseUid, courses });
      res
        .status(201)
        .json({ message: "Course history created", courseHistory: hist });
    }
  } catch (err) {
    console.error("Submit history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set major
router.post("/set-major", verifyFirebaseToken, async (req, res) => {
  const { major } = req.body;
  const firebaseUid = req.firebaseUid;

  try {
    const updated = await CourseHistory.findOneAndUpdate(
      { firebaseUid },
      { major },
      { new: true, upsert: false }
    );

    if (!updated) {
      return res.status(404).json({ error: "Course history not found" });
    }

    res.json({ message: "Major updated successfully", updated });
  } catch (err) {
    console.error("Set major error:", err);
    res.status(500).json({ error: "Failed to update major" });
  }
});

router.get("/get-major", verifyFirebaseToken, async (req, res) => {
  const firebaseUid = req.firebaseUid;

  try {
    const courseHistory = await CourseHistory.findOne({ firebaseUid });

    if (!courseHistory) {
      return res.status(404).json({ error: "Course history not found" });
    }

    return res.json({ major: courseHistory.major || "Not set" });
  } catch (err) {
    console.error("Error fetching major:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
