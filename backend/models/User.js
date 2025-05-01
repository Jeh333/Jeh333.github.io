const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  courseHistory: { type: mongoose.Schema.Types.ObjectId, ref: "CourseHistory" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
