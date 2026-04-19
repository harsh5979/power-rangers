const express = require('express');
const router  = express.Router();
const protect   = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/facultyController');

router.use(protect, authorize('faculty', 'subject_coordinator', 'mentor'));
router.get('/my-info',         c.getMyInfo);
router.get('/subject-summary', c.getSubjectSummary);
router.patch('/subjects',      c.updateSubjects);
router.get('/high-risk-students', c.getHighRiskStudents);
router.post('/send-message',   c.sendMessageToStudent);

module.exports = router;
