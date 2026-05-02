const express = require('express');
const router = express.Router();
const { getPendingMarks, reviewMarks, getDeptAnalytics } = require('../controllers/hodController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('HOD'));

router.get('/pending-marks', getPendingMarks);
router.put('/review-marks', reviewMarks);
router.put('/mark-as-seen', markAsSeen);
router.get('/analytics', getDeptAnalytics);

module.exports = router;
