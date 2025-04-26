const mongoose = require("mongoose");

const CourseListSchema = new mongoose.Schema({
  _id: String,
  program: String,
  description: String,
  Credits: String,
  Prerequisites: String,
});

const CourseList = mongoose.model("CourseList", CourseListSchema, "CourseList");

module.exports = CourseList;
