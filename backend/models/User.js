const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'HOD', 'Faculty', 'Student'],
    required: true,
  },
  phone: {
    type: String,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  semester: {
    type: Number,
  },
  section: {
    type: String,
  },
  studentId: {
    type: String,
  },
  photo: {
    type: String, // Base64 or URL
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  assignedSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  captchaAnswer: {
    type: String,
  },
  captchaExpires: {
    type: Date,
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
