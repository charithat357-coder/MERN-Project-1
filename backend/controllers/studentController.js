const Marks = require('../models/Marks');

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

module.exports = {
  getStudentMarks
};
