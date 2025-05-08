const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// === CONFIGURATION ===
const MAJORS = [
    { name: "Information Technology", type: "BS", prefix: "INFOTC" },
    { name: "Computer Science", type: "BS", prefix: ["CMP_SC", "INFOTC", "MATH"] },
    { name: "Mathematics", type: "BS", prefix: "MATH" },
    { name: "Accountancy", type: "BS", prefix: "ACCTCY" },
    { name: "Business Administration", type: "BS", prefix: ["BUS_AD", "MANGMT"] },
    { name: "Electrical Engineering", type: "BS", prefix: "ECE" },
  ];
  
  const USER_COUNT = 5;
  const COURSE_MIN = 35;
  const COURSE_MAX = 45;
  

// === MONGO SETUP ===
const MONGO_URI = 'mongodb+srv://jeh333:9ygYAfGE6YovIwhr@clustercapstone.1yopo.mongodb.net/muvisualizer?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI, { useNewUrlParser: true });

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

async function getRandomCourses(n = 6, prefixes = []) {
    if (!Array.isArray(prefixes)) {
      prefixes = [prefixes];
    }
  
    const regexFilters = prefixes.map(p => ({
      _id: { $regex: `^${p} ` }
    }));
  
    const selected = await CourseList.aggregate([
      { $match: { $or: regexFilters } },
      { $sample: { size: n } }
    ]);
  
    const grades = ["A", "A-", "B+", "B", "C+", "C", "D", "F"];
    const semesters = ["FS20", "SP21", "FS21", "SP22", "FS22", "SP23", "FS23", "SP24", "FS24", "SP25"];
  
    return selected.map(course => ({
      programId: course._id,
      semester: faker.helpers.arrayElement(semesters),
      grade: faker.helpers.arrayElement(grades),
      status: "Taken",
      _id: new mongoose.Types.ObjectId()
    }));
}
  

async function createCustomTestUser() {
    const firebaseUid = uuidv4();
    const pawprint = faker.string.alpha({ length: 3, casing: 'lower' }) + faker.number.int({ min: 100, max: 999 });
    const email = `${pawprint}@umsystem.edu`;
  
    const user = new User({ firebaseUid, email, testUser: true });
    await user.save();
  
    const chosenMajor = faker.helpers.arrayElement(MAJORS);
    const courseCount = faker.number.int({ min: COURSE_MIN, max: COURSE_MAX });
    const courses = await getRandomCourses(courseCount, chosenMajor.prefix);
  
    if (courses.length === 0) {
      console.log(`No courses found for prefix ${chosenMajor.prefix}. Skipping user.`);
      return;
    }
  
    const courseHistory = new CourseHistory({
      firebaseUid,
      major: `${chosenMajor.name}`,
      testUser: true,
      courses
    });
  
    await courseHistory.save();
    console.log(`Created ${email} with ${courses.length} courses (${chosenMajor.name})`);
}
  

async function run() {
  for (let i = 0; i < USER_COUNT; i++) {
    await createCustomTestUser();
  }
  mongoose.connection.close();
}

run().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
