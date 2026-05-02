const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Department = require('./models/Department');
const Subject = require('./models/Subject');
const Marks = require('./models/Marks');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Department.deleteMany();
    await Subject.deleteMany();
    await Marks.deleteMany();

    const cseDept = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE'
    });

    await User.create({
      name: 'Admin User',
      email: 'admin@college.edu',
      password: 'password123', // Will be hashed by pre-save middleware
      role: 'Admin',
      phone: '1234567890'
    });

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  // destroy data logic if needed
} else {
  importData();
}
