const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Define the Course Schema (individual courses within a course history)
const CourseSchema = new mongoose.Schema({
  programId: { type: String, required: true },
  description: { type: String, required: true },
  semester: { type: String, required: true },
  grade: { type: String, required: true },
  credits: { type: Number, required: true },
  status: { type: String, enum: ["Taken", "Transferred"], required: true },
});

// Define the CourseHistory Schema (a single document containing all courses for one user)
const CourseHistorySchema = new mongoose.Schema({
  courses: { type: [CourseSchema], required: true },
});

// Create the CourseHistory model
const CourseHistory = mongoose.model("CourseHistory", CourseHistorySchema);

// Routes
app.post("/submit-course-history", async (req, res) => {
  try {
    const { courses } = req.body;

    // Save the entire course history as a single document
    const courseHistory = new CourseHistory({ courses });
    await courseHistory.save();

    res.status(201).json({ message: "Course history saved successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
