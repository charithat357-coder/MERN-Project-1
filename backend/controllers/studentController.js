const Marks = require('../models/Marks');
const User = require('../models/User');

// @desc    Get student marks (only approved)
// @route   GET /api/student/marks
// @access  Private/Student
const getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.user._id, status: 'Approved' })
      .populate('subject', 'name code semester');
      
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private/Student
const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate('department', 'name')
      .select('-password -otp -captchaAnswer');
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStudentMarks,
  getStudentProfile
};
