const express = require('express');
const router = express.Router();
const { enterMarks, getFilteredStudents, getFacultyMarks, getMySubjects } = require('../controllers/facultyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('Faculty'));

router.get('/my-subjects', getMySubjects);
router.get('/students', getFilteredStudents);
router.get('/marks', getFacultyMarks);
router.post('/marks', enterMarks);

module.exports = router;
