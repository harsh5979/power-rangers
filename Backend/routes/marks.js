const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/marksController');

router.use(protect);
router.post('/',                authorize('subject_coordinator', 'faculty', 'principal'), c.uploadMarks);
router.get('/subject/:subject', authorize('subject_coordinator', 'faculty', 'principal'), c.getSubjectMarks);
router.get('/:studentId',       c.getStudentMarks);

module.exports = router;
