const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/interventionController');

router.use(protect);
router.post('/',           authorize('mentor', 'subject_coordinator', 'principal', 'principal'), c.logIntervention);
router.get('/my',          authorize('mentor', 'subject_coordinator', 'principal'), c.myInterventions);
router.get('/:studentId',  c.getStudentInterventions);
router.patch('/:id/close', authorize('mentor', 'subject_coordinator', 'principal', 'principal'), c.closeIntervention);

module.exports = router;
