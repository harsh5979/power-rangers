const express = require('express');
const router  = express.Router();
const protect   = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/studentController');

router.use(protect);
router.get('/',           authorize('principal', 'college_admin', 'subject_coordinator', 'mentor', 'faculty'), c.getStudents);
router.get('/my-profile', authorize('student'), c.myProfile);
router.post('/',          authorize('subject_coordinator', 'mentor', 'subject_coordinator', 'principal'), c.createStudent);
router.post('/bulk',      authorize('subject_coordinator', 'mentor', 'subject_coordinator', 'principal'), c.bulkCreateStudents);
router.get('/:id',        c.getStudent);
router.put('/:id/assign-mentor', authorize('principal', 'principal'), c.assignMentor);
router.patch('/:id',      authorize('subject_coordinator', 'mentor', 'subject_coordinator', 'principal', 'principal'), c.updateStudent);
router.delete('/bulk',     authorize('subject_coordinator', 'mentor', 'principal', 'college_admin'), c.bulkDeleteStudents);
router.delete('/:id',     authorize('subject_coordinator', 'mentor', 'subject_coordinator', 'principal', 'principal'), c.deleteStudent);

module.exports = router;
