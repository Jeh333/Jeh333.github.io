const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://jeh333:9ygYAfGE6YovIwhr@clustercapstone.1yopo.mongodb.net/muvisualizer?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to MongoDB");
    return deleteTestUsers();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const User = mongoose.model('User', new mongoose.Schema({
  firebaseUid: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
  testUser: Boolean
}));

const CourseHistory = mongoose.model('CourseHistory', new mongoose.Schema({
  firebaseUid: String,
  major: String,
  testUser: Boolean,
  courses: Array,
  createdAt: { type: Date, default: Date.now }
}));

async function deleteTestUsers() {
  try {
    const userResult = await User.deleteMany({ testUser: true });
    const courseHistoryResult = await CourseHistory.deleteMany({ testUser: true });

    console.log(`Deleted ${userResult.deletedCount} test users`);
    console.log(`Deleted ${courseHistoryResult.deletedCount} test course histories`);
  } catch (err) {
    console.error("Error deleting test users or course histories:", err);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}
