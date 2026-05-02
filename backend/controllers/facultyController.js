const Marks = require('../models/Marks');
const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Enter or update marks
// @route   POST /api/faculty/marks
// @access  Private/Faculty
const enterMarks = async (req, res) => {
  const { studentId, subjectId, mid1, mid2, assignment1, assignment2, status } = req.body;
  const facultyId = req.user._id;

  try {
    let marksEntry = await Marks.findOne({ student: studentId, subject: subjectId });

    if (marksEntry) {
      if (marksEntry.status === 'Approved') {
        return res.status(400).json({ message: 'Cannot edit marks once HOD has approved/locked them.' });
      }
      
      // Update existing
      marksEntry.mid1 = mid1 !== undefined ? mid1 : marksEntry.mid1;
      marksEntry.mid2 = mid2 !== undefined ? mid2 : marksEntry.mid2;
      marksEntry.assignment1 = assignment1 !== undefined ? assignment1 : marksEntry.assignment1;
      marksEntry.assignment2 = assignment2 !== undefined ? assignment2 : marksEntry.assignment2;
      marksEntry.status = status || marksEntry.status;
      marksEntry.seenByHOD = false; // Reset seen status if resubmitted
      
      await marksEntry.save();
    } else {
      // Create new
      marksEntry = await Marks.create({
        student: studentId,
        subject: subjectId,
        faculty: facultyId,
        mid1: mid1 || 0,
        mid2: mid2 || 0,
        assignment1: assignment1 || 0,
        assignment2: assignment2 || 0,
        status: status || 'Draft'
      });
    }

    res.status(200).json(marksEntry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get filtered students for marks entry
// @route   GET /api/faculty/students
// @access  Private/Faculty
const getFilteredStudents = async (req, res) => {
  const { department, semester, section } = req.query;
  
  try {
    const query = { role: 'Student' };
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (section) query.section = section;

    console.log("Faculty Student Search Query:", query);

    const students = await User.find(query).select('name email studentId semester section');
    console.log(`Found ${students.length} students`);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get marks submitted by this faculty
// @route   GET /api/faculty/marks
// @access  Private/Faculty
const getFacultyMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ faculty: req.user._id })
      .populate('student', 'name studentId')
      .populate('subject', 'name code');
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  enterMarks,
  getFilteredStudents,
  getFacultyMarks
};
