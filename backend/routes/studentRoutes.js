const express = require('express');
const router = express.Router();
const { getStudentMarks, getStudentProfile } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('Student'));

router.get('/marks', getStudentMarks);
router.get('/profile', getStudentProfile);

module.exports = router;
