const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendNotification } = require('../utils/sendNotification');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.role !== role) {
      return res.status(401).json({ message: 'Role mismatch. Select correct user type.' });
    }

    if (user && (await user.matchPassword(password))) {
      if (user.role === 'Student') {
        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          token: generateToken(user._id),
        });
      } else {
        // Generate 6 digit OTP
        const otp = '123456';

        // Generate simple Math Captcha
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const captchaQuestion = `What is ${num1} + ${num2}?`;
        const captchaAnswer = (num1 + num2).toString();

        // Use updateOne to bypass the password pre-save hook
        await User.updateOne({ _id: user._id }, {
          otp,
          otpExpires: Date.now() + 10 * 60 * 1000,
          captchaAnswer,
          captchaExpires: Date.now() + 10 * 60 * 1000
        });

        await sendNotification(user, otp);

        res.json({
          requireOtp: true,
          captchaQuestion,
          message: 'OTP sent via SMS to your phone.'
        });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department');

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        studentId: user.studentId
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate and send OTP
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  const { email, role } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: 'Role mismatch. Select correct user type.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiration (10 minutes)
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // In a real app, send this via email/SMS. Here we just log it and return it for demo purposes.
    console.log(`[DEVELOPMENT ONLY] OTP for ${email} is ${otp}`);

    res.json({ message: 'OTP sent successfully (check backend console for demo)' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { email, otp, captcha, role } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: 'Role mismatch. Select correct user type.' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.captchaAnswer || user.captchaAnswer !== captcha) {
      return res.status(400).json({ message: 'Incorrect Captcha' });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP or Captcha has expired' });
    }

    // Clear OTP using updateOne to bypass the password pre-save hook
    await User.updateOne({ _id: user._id }, {
      $unset: { otp: '', otpExpires: '', captchaAnswer: '', captchaExpires: '' }
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  loginUser,
  getUserProfile,
  sendOTP,
  verifyOTP
};
