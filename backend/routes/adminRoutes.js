const express = require('express');
const router = express.Router();
const { 
  getUsers, createUser, updateUser, deleteUser, getAnalytics,
  getDepartments, createDepartment, deleteDepartment,
  getSubjects, createSubject, deleteSubject
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('Admin'));

router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

router.route('/departments')
  .get(getDepartments)
  .post(createDepartment);

router.route('/departments/:id')
  .delete(deleteDepartment);

router.route('/subjects')
  .get(getSubjects)
  .post(createSubject);

router.route('/subjects/:id')
  .delete(deleteSubject);

router.get('/analytics', getAnalytics);

module.exports = router;
