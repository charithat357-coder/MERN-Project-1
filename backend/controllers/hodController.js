const Marks = require('../models/Marks');
const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Get pending marks for HOD's department
// @route   GET /api/hod/pending-marks
// @access  Private/HOD
const getPendingMarks = async (req, res) => {
  try {
    // Find all subjects in this HOD's department
    const subjects = await Subject.find({ branch: req.user.department });
    const subjectIds = subjects.map(s => s._id);

    const pendingMarks = await Marks.find({
      subject: { $in: subjectIds },
      status: 'Submitted'
    })
    .populate('student', 'name studentId semester section')
    .populate('subject', 'name code')
    .populate('faculty', 'name');

    res.json(pendingMarks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve or Reject marks
// @route   PUT /api/hod/review-marks
// @access  Private/HOD
const reviewMarks = async (req, res) => {
  const { markIds, status } = req.body; // status: 'Approved' or 'Rejected'

  try {
    await Marks.updateMany(
      { _id: { $in: markIds } },
      { status: status, seenByHOD: true }
    );

    res.json({ message: `Marks ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get department analytics
// @route   GET /api/hod/analytics
// @access  Private/HOD
const getDeptAnalytics = async (req, res) => {
  try {
    const subjects = await Subject.find({ branch: req.user.department });
    const subjectIds = subjects.map(s => s._id);

    const marks = await Marks.find({ subject: { $in: subjectIds }, status: 'Approved' });
    
    // Simple pass percentage calculation (assuming 40% is pass)
    const total = marks.length;
    const passed = marks.filter(m => m.total >= 16).length; // 16 out of 40 (40%)
    const passPercentage = total > 0 ? (passed / total) * 100 : 0;

    res.json({
      totalStudents: await User.countDocuments({ role: 'Student', department: req.user.department }),
      totalFaculty: await User.countDocuments({ role: 'Faculty', department: req.user.department }),
      passPercentage: passPercentage.toFixed(2),
      chartData: [
        { name: 'Pass', value: passed },
        { name: 'Fail', value: total - passed }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark marks as seen by HOD
// @route   PUT /api/hod/mark-as-seen
// @access  Private/HOD
const markAsSeen = async (req, res) => {
  const { markIds } = req.body;

  try {
    await Marks.updateMany(
      { _id: { $in: markIds } },
      { seenByHOD: true }
    );
    res.json({ message: 'Marks marked as seen' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getPendingMarks,
  reviewMarks,
  markAsSeen,
  getDeptAnalytics
};
