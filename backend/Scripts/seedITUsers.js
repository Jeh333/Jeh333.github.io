const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

console.log("Starting SeedITUsers.js...");

const MONGO_URI = 'mongodb+srv://jeh333:9ygYAfGE6YovIwhr@clustercapstone.1yopo.mongodb.net/muvisualizer?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to MongoDB");
    runSeedProcess();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const User = mongoose.model('User', new mongoose.Schema({
  firebaseUid: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
  testUser: { type: Boolean, default: true },
}));

const CourseList = mongoose.model(
  'CourseList',
  new mongoose.Schema({
    _id: String,
    program: String,
    description: String,
    Credits: String,
    Prerequisites: String,
  }),
  'CourseList'
);

const CourseHistory = mongoose.model('CourseHistory', new mongoose.Schema({
  firebaseUid: String,
  major: String,
  testUser: { type: Boolean, default: true },
  courses: [{
    programId: String,
    semester: String,
    grade: String,
    status: String,
    _id: mongoose.Schema.Types.ObjectId
  }],
  createdAt: { type: Date, default: Date.now }
}));

async function getRandomITCourses(n = 6) {
  console.log(`Fetching ${n} random INFOTC courses...`);
  try {
    const itCourses = await CourseList.aggregate([
      { $match: { _id: { $regex: /^INFOTC / } } },
      { $sample: { size: n } }
    ]);

    if (itCourses.length === 0) {
      console.error("No INFOTC courses found in CourseList");
      return [];
    }

    const grades = ["A", "A-", "B+", "B", "C+", "C", "D", "F"];
    const semesters = ["FS20", "SP21", "FS21", "SP22", "FS22", "SP23", "FS23", "SP24", "FS24", "SP25"];

    return itCourses.map(course => ({
      programId: course._id,
      semester: faker.helpers.arrayElement(semesters),
      grade: faker.helpers.arrayElement(grades),
      status: "Taken",
      _id: new mongoose.Types.ObjectId()
    }));
  } catch (err) {
    console.error("Error retrieving IT courses:", err);
    return [];
  }
}

async function createITTestUser() {
  try {
    const firebaseUid = uuidv4();
    const pawprint = faker.string.alpha({ length: 3, casing: 'lower' }) + faker.number.int({ min: 100, max: 999 });
    const email = `${pawprint}@umsystem.edu`;

    console.log(`Creating IT test user: ${email}`);

    const user = new User({ firebaseUid, email, testUser: true });
    await user.save();

    const courseCount = faker.number.int({ min: 5, max: 12 });
    const courses = await getRandomITCourses(courseCount);
    if (courses.length === 0) {
      console.log("No IT courses found, skipping user.");
      return;
    }

    const courseHistory = new CourseHistory({
      firebaseUid,
      major: "Information Technology (BS)",
      testUser: true,
      courses
    });

    await courseHistory.save();
    console.log(`Saved course history for IT user: ${email}`);

  } catch (err) {
    console.error("Failed to create IT test user:", err);
  }
}

async function runSeedProcess() {
  console.log("Seeding IT test users...");
  try {
    for (let i = 0; i < 20; i++) {
      await createITTestUser();
    }
  } catch (err) {
    console.error("Error during seed process:", err);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.error("Unhandled Rejection at:", p, "reason:", reason);
});
