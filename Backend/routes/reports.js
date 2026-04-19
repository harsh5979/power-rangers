const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/reportController');

router.use(protect);
router.get('/at-risk', authorize('principal', 'subject_coordinator'), c.atRiskReport);
router.get('/student/:id', c.studentReport);
router.get('/comprehensive', authorize('principal', 'college_admin'), c.comprehensiveReport);

module.exports = router;
