const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const CourseList = require("../models/CourseList");
const CourseHistory = require("../models/CourseHistory");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const mongoose = require("mongoose");

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
          courses.push({
            programId: `${subject} ${number}`,
            semester,
            grade,
            status: "Taken",
          });
        }
      }

      // Deduplicate within the parsed PDF itself
      const deduplicatedCoursesMap = new Map();
      for (const course of courses) {
        const key = `${course.programId}_${course.semester}`;
        if (!deduplicatedCoursesMap.has(key)) {
          deduplicatedCoursesMap.set(key, course);
        }
      }
      const deduplicatedCourses = Array.from(deduplicatedCoursesMap.values());

      if (deduplicatedCourses.length === 0) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: "No valid courses found in PDF" });
      }

      let courseHistory = await CourseHistory.findOne({ firebaseUid });
      if (courseHistory) {
        await CourseHistory.updateOne(
          { firebaseUid },
          { $set: { courses: deduplicatedCourses } }
        );
      } else {
        courseHistory = await CourseHistory.create({
          firebaseUid,
          courses: deduplicatedCourses,
        });
      }


      fs.unlinkSync(file.path);
      return res.status(200).json({
        message: "PDF parsed and course history saved",
        courseCount: deduplicatedCourses.length,
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
      const existing = hist.courses;

      // Filter out any duplicates
      const newUniqueCourses = courses.filter((newCourse) => {
        return !existing.some(
          (existingCourse) =>
            existingCourse.programId === newCourse.programId &&
            existingCourse.semester === newCourse.semester
        );
      });

      hist.courses.push(...newUniqueCourses);
      await hist.save();

      res.json({
        message: "Course history updated",
        added: newUniqueCourses.length,
        totalCourses: hist.courses.length,
      });
    } else {
      hist = await CourseHistory.create({ firebaseUid, courses });
      res.status(201).json({
        message: "Course history created",
        courseHistory: hist,
      });
    }
  } catch (err) {
    console.error("Submit history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Edit a specific course by _id
router.post("/edit-course", verifyFirebaseToken, async (req, res) => {
  const { courseId, updatedData } = req.body;
  const firebaseUid = req.firebaseUid;

  if (!courseId || !updatedData) {
    return res.status(400).json({ error: "Missing courseId or updated data" });
  }

  try {
    const courseHistory = await CourseHistory.findOne({ firebaseUid });
    if (!courseHistory) {
      return res.status(404).json({ error: "Course history not found" });
    }

    const course = courseHistory.courses.id(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Update the fields you want
    if (updatedData.semester) course.semester = updatedData.semester;
    if (updatedData.grade) course.grade = updatedData.grade;

    await courseHistory.save();

    res.json({ message: "Course updated successfully", updatedCourse: course });
  } catch (err) {
    console.error("Edit course error:", err);
    res.status(500).json({ error: "Failed to edit course" });
  }
});


// Set major
router.post("/set-major", verifyFirebaseToken, async (req, res) => {
  const { major } = req.body;
  const firebaseUid = req.firebaseUid;

  try {
    const updated = await CourseHistory.findOneAndUpdate(
      { firebaseUid },
      { $set: { major }, $setOnInsert: { courses: [] } },
      { new: true, upsert: true }
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

// Route to get full course catalog
router.get("/course-catalog", async (req, res) => {
  try {
    const allCourses = await CourseList.find({});
    res.json(allCourses);
  } catch (err) {
    console.error("Error fetching course catalog:", err);
    res.status(500).json({ error: "Failed to fetch course catalog" });
  }
});

//Process user data for graphs
router.get("/statistics/:major", verifyFirebaseToken, async (req, res) => {
  try {
    const { major } = req.params;
    const statType = req.query.type || "distribution";
    const normalizedMajor = major.trim().toLowerCase();
    const allHistories = await CourseHistory.find().lean();
    const histories = allHistories.filter(
      (h) => h.major?.trim().toLowerCase() === normalizedMajor
    );

    if (statType === "grades") {
      const gradeMap = {};
      histories.forEach((history) => {
        history.courses.forEach((course) => {
          if (!course.programId || !course.grade) return;
          if (!gradeMap[course.programId]) gradeMap[course.programId] = {};
          gradeMap[course.programId][course.grade] =
            (gradeMap[course.programId][course.grade] || 0) + 1;
        });
      });

      for (const course in gradeMap) {
        const total = Object.values(gradeMap[course]).reduce(
          (sum, count) => sum + count,
          0
        );
        for (const grade in gradeMap[course]) {
          gradeMap[course][grade] = +(
            (gradeMap[course][grade] / total) *
            100
          ).toFixed(1);
        }
      }
      return res.json(gradeMap);
    }

    const semesterMap = {};
    histories.forEach((history) => {
      const semesterOrder = ["SP", "SS", "FS", "SU"];
      const sortedCourses = [...history.courses]
        .filter((c) => c.semester && c.programId)
        .sort((a, b) => {
          const [aTerm, aYear] = [
            a.semester.slice(0, 2),
            parseInt(a.semester.slice(2)),
          ];
          const [bTerm, bYear] = [
            b.semester.slice(0, 2),
            parseInt(b.semester.slice(2)),
          ];
          if (aYear !== bYear) return aYear - bYear;
          return semesterOrder.indexOf(aTerm) - semesterOrder.indexOf(bTerm);
        });

      const regularTerms = ["SP", "FS"];
      const summerTerms = ["SS", "SU"];

      const regularCourses = sortedCourses.filter((c) =>
        regularTerms.includes(c.semester.slice(0, 2))
      );
      const summerCourses = sortedCourses.filter((c) =>
        summerTerms.includes(c.semester.slice(0, 2))
      );

      const uniqueRegularSemesters = [
        ...new Set(regularCourses.map((c) => c.semester)),
      ];
      const semesterPosition = Object.fromEntries(
        uniqueRegularSemesters.map((s, i) => [s, `Semester ${i + 1}`])
      );

      const seenCourseSemesters = new Set();
      [...regularCourses, ...summerCourses].forEach((course) => {
        let relSemester = semesterPosition[course.semester];
        if (!relSemester) {
          relSemester = "Summer Semesters";
        }
        const key = `${relSemester}::${course.programId}::${history.firebaseUid}`;
        if (seenCourseSemesters.has(key)) return;
        seenCourseSemesters.add(key);
        if (!semesterMap[relSemester]) semesterMap[relSemester] = {};
        semesterMap[relSemester][course.programId] =
          (semesterMap[relSemester][course.programId] || 0) + 1;
      });
    });

    const userCount = histories.length || 1;
    for (const semester in semesterMap) {
      for (const course in semesterMap[semester]) {
        semesterMap[semester][course] = +(
          (semesterMap[semester][course] / userCount) *
          100
        ).toFixed(1);
      }
    }

    const orderedSemesterMap = {};
    const semesterKeys = Object.keys(semesterMap).sort((a, b) => {
      if (a === "Summer Semesters") return 1;
      if (b === "Summer Semesters") return -1;

      const aNum = parseInt(a.match(/\d+/)?.[0] || "0");
      const bNum = parseInt(b.match(/\d+/)?.[0] || "0");
      return aNum - bNum;
    });

    semesterKeys.forEach((key) => {
      orderedSemesterMap[key] = semesterMap[key];
    });

    res.json(orderedSemesterMap);
  } catch (err) {
    console.error("Error generating statistics:", err);
    res.status(500).json({ error: "Failed to get statistics" });
  }
});

// Load the user's courses
router.get("/api/user/courses", async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId).populate('courseHistory');
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.courseHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load courses" });
  }
});

//Delete user course
router.delete(
  "/api/user/courses/:id",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const firebaseUid = req.firebaseUid;
      const courseId = req.params.id;

      const courseHistory = await CourseHistory.findOne({ firebaseUid });
      if (!courseHistory) {
        return res.status(404).json({ error: "Course history not found" });
      }

      const courseIndex = courseHistory.courses.findIndex(
        (c) => c._id.toString() === courseId
      );
      if (courseIndex === -1) {
        return res.status(404).json({ error: "Course not found" });
      }

      courseHistory.courses.splice(courseIndex, 1);
      await courseHistory.save();

      res.status(200).json({ message: "Course deleted successfully" });
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ error: "Failed to delete course" });
    }
  }
);


module.exports = router;
