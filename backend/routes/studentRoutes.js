const express = require('express');
const router = express.Router();
const { getStudentMarks } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('Student'));

router.get('/marks', getStudentMarks);

module.exports = router;
