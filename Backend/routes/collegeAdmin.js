const express = require('express');
const router  = express.Router();
const protect   = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c  = require('../controllers/collegeAdminController');
const pc = require('../controllers/principalController');

router.use(protect, authorize('college_admin', 'principal'));

// College settings
router.get('/college',           c.getCollege);
router.patch('/college',         c.updateCollege);

// Principal
router.get('/principal',         c.getPrincipal);
router.post('/principal',        c.createPrincipal);
router.delete('/principal/:id',  c.deletePrincipal);

// Faculty management (college_admin mirrors principal routes)
router.get('/faculty',                         pc.getFaculty);
router.post('/faculty',                        pc.createFaculty);
router.patch('/faculty/:id',                   pc.updateFaculty);
router.delete('/faculty/:id',                  pc.deleteFaculty);
router.post('/faculty/:id/resend-credentials', pc.resendCredentials);

// Departments
router.get('/departments',          c.getDepartments);
router.post('/departments',         c.createDepartment);
router.put('/departments/:id',      c.updateDepartment);
router.delete('/departments/:id',   c.deleteDepartment);

// Department detail — semester overview
router.get('/departments/:id/overview',  c.getDepartmentOverview);

// Subjects
router.post('/departments/:id/subjects', c.createSubject);
router.put('/subjects/:id',              c.updateSubject);
router.delete('/subjects/:id',           c.deleteSubject);

// Assign faculty to subject
router.put('/subjects/:id/assign-faculty', c.assignFacultyToSubject);

// Assign mentor to batch
router.post('/departments/:id/assign-mentor', c.assignMentorToBatch);

// Promote students
router.post('/departments/:id/promote', c.promoteStudents);

// Faculty list for assignment dropdowns
router.get('/faculty-list', c.getFacultyList);

module.exports = router;
