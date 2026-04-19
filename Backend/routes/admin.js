const express = require('express');
const router  = express.Router();
const protect   = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/adminController');

router.use(protect, authorize('admin'));
router.get('/college-admins',        c.getCollegeAdmins);
router.post('/college-admins',       c.createCollegeAdmin);
router.delete('/college-admins/:id', c.deleteCollegeAdmin);
router.get('/principals',            c.getPrincipals);
router.post('/principals',           c.createPrincipal);
router.delete('/principals/:id',     c.deletePrincipal);
router.get('/colleges',              c.getColleges);
router.patch('/colleges/:id',        c.updateCollege);
router.post('/auto-semester',        c.autoUpdateSemesters);

module.exports = router;
