const Department = require('../models/Department');
const Subject = require('../models/Subject');

// @desc    Get all departments
// @route   GET /api/data/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all subjects
// @route   GET /api/data/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({}).populate('branch', 'name');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDepartments,
  getSubjects
};
