const express = require('express');
const router  = express.Router();
const protect   = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/principalController');

router.use(protect, authorize('principal', 'principal'));
router.get('/faculty',                    c.getFaculty);
router.post('/faculty',                   c.createFaculty);
router.patch('/faculty/:id',              c.updateFaculty);
router.delete('/faculty/:id',             c.deleteFaculty);
router.post('/faculty/:id/resend-credentials', c.resendCredentials);
router.get('/college-info',               c.getCollegeInfo);

module.exports = router;
