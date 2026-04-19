const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/riskController');

router.use(protect);
router.get('/summary',              authorize('principal', 'principal', 'mentor', 'subject_coordinator', 'subject_coordinator'), c.riskSummary);
router.post('/calculate-all',       authorize('principal', 'principal'), c.calculateAllRisk);
router.post('/calculate/:studentId',authorize('principal', 'principal', 'mentor', 'subject_coordinator', 'subject_coordinator'), c.calculateStudentRisk);

module.exports = router;
