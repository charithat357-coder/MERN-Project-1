const express = require('express');
const router = express.Router();
const { loginUser, getUserProfile, sendOTP, verifyOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/profile', protect, getUserProfile);

module.exports = router;
