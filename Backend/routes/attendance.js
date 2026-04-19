const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/attendanceController');

router.use(protect);
router.post('/',          authorize('subject_coordinator', 'faculty', 'principal'), c.markAttendance);
router.get('/:studentId', c.getStudentAttendance);

module.exports = router;
