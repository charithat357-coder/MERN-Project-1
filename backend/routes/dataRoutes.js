const express = require('express');
const router = express.Router();
const { getDepartments, getSubjects } = require('../controllers/dataController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/departments', getDepartments);
router.get('/subjects', getSubjects);

module.exports = router;
