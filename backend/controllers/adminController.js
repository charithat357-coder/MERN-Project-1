const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate('department', 'name code')
      .populate('assignedSubjects', 'name code')
      .select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { name, email, password, role, phone, department, studentId } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      department,
      semester: req.body.semester,
      section: req.body.section,
      studentId,
      photo: req.body.photo,
      assignedSubjects: req.body.assignedSubjects || []
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalFaculty = await User.countDocuments({ role: 'Faculty' });
    const totalSubjects = await Subject.countDocuments();
    const totalDepartments = await Department.countDocuments();

    res.json({
      totalStudents,
      totalFaculty,
      totalSubjects,
      totalDepartments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.phone = req.body.phone || user.phone;
    user.department = req.body.department || user.department;
    user.semester = req.body.semester !== undefined ? req.body.semester : user.semester;
    user.section = req.body.section !== undefined ? req.body.section : user.section;
    user.photo = req.body.photo !== undefined ? req.body.photo : user.photo;
    user.assignedSubjects = req.body.assignedSubjects || user.assignedSubjects;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (error) {
    res.status(400).json({ message: 'Error creating department' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department' });
  }
};

// Subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({}).populate('branch', 'name');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error) {
    res.status(400).json({ message: 'Error creating subject' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAnalytics,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getSubjects,
  createSubject,
  deleteSubject
};
