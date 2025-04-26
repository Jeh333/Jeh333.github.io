const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  programId: { type: String, required: true },
  semester: { type: String, required: true },
  grade: {
    type: String,
    required: true,
    match: /^(A|A-|A\+|B|B-|B\+|C|C-|C\+|D|D-|D\+|F|W|IP|S)$/,
  },
  description: { type: String },
  credits: { type: Number, min: 0 },
  status: {
    type: String,
    enum: ["Taken", "Transferred"],
  },
});

const CourseHistorySchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, index: true },
  courses: { type: [CourseSchema], required: true },
  createdAt: { type: Date, default: Date.now },
  major: { type: String },
});

const CourseHistory = mongoose.model("CourseHistory", CourseHistorySchema);

module.exports = CourseHistory;
