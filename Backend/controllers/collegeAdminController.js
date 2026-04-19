const User       = require('../models/User');
const College    = require('../models/College');
const Department = require('../models/Department');
const Subject    = require('../models/Subject');
const Student    = require('../models/Student');
const { createUser } = require('../services/userService');

// ── College ───────────────────────────────────────────────────

// GET /api/college-admin/college
exports.getCollege = async (req, res) => {
  try {
    const college = await College.findOne({ name: req.college }).lean();
    // Get departments from Department model
    const deptDocs = await Department.find({ college: req.college }).select('name _id').sort({ name: 1 }).lean();
    const departments = deptDocs.map(d => d.name);
    // Get subjects grouped by department
    const subjects = await Subject.find({ college: req.college }).select('name department semester').lean();
    const subjectsByDept = {};
    for (const s of subjects) {
      const deptId = s.department.toString();
      if (!subjectsByDept[deptId]) subjectsByDept[deptId] = [];
      subjectsByDept[deptId].push({ name: s.name, semester: s.semester });
    }
    const subjectsByDepartment = {};
    for (const d of deptDocs) {
      subjectsByDepartment[d.name] = subjectsByDept[d._id.toString()] || [];
    }
    res.json({
      ...(college || { name: req.college, branches: [] }),
      departments,
      subjectsByDepartment,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PATCH /api/college-admin/college
exports.updateCollege = async (req, res) => {
  try {
    const { branches, departments, semesterDurationMonths, totalSemesters, currentAcademicYear } = req.body;
    const update = {};
    if (branches)               update.branches               = branches;
    if (departments)            update.departments            = departments;
    if (semesterDurationMonths) update.semesterDurationMonths = semesterDurationMonths;
    if (totalSemesters)         update.totalSemesters         = totalSemesters;
    if (currentAcademicYear)    update.currentAcademicYear    = currentAcademicYear;
    const college = await College.findOneAndUpdate({ name: req.college }, update, { new: true, upsert: true });
    res.json(college);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Principal ─────────────────────────────────────────────────

exports.getPrincipal = async (req, res) => {
  try {
    const principal = await User.findOne({ role: 'principal', college: req.college })
      .select('name email college createdAt lastLogin').lean();
    res.json(principal || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createPrincipal = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const existing = await User.findOne({ role: 'principal', college: req.college });
    if (existing) return res.status(400).json({ error: 'Principal already exists for this college' });
    const user = await createUser({ name, email, role: 'principal', college: req.college });
    res.status(201).json({ message: `Principal created. Credentials sent to ${email}`, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
};

exports.deletePrincipal = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'principal', college: req.college });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Principal deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Departments CRUD ──────────────────────────────────────────

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ college: req.college }).sort({ name: 1 }).lean();
    res.json(departments);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, durationYears } = req.body;
    if (!name || !durationYears) return res.status(400).json({ error: 'name and durationYears required' });
    const exists = await Department.findOne({ college: req.college, name });
    if (exists) return res.status(400).json({ error: 'Department already exists' });
    const dept = await Department.create({
      name, college: req.college,
      durationYears: Number(durationYears),
      totalSemesters: Number(durationYears) * 2,
      createdBy: req.user,
    });
    res.status(201).json({ message: `Department "${name}" created`, department: dept });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { name, durationYears } = req.body;
    const update = {};
    if (name) {
      // Validate no duplicate name in same college
      const dup = await Department.findOne({ college: req.college, name, _id: { $ne: req.params.id } });
      if (dup) return res.status(400).json({ error: 'A department with this name already exists' });
      update.name = name;
    }
    if (durationYears) {
      update.durationYears  = Number(durationYears);
      update.totalSemesters = Number(durationYears) * 2;
    }
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, college: req.college }, update, { new: true }
    ).lean();
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findOneAndDelete({ _id: req.params.id, college: req.college });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    // Also delete all subjects for this department
    await Subject.deleteMany({ department: req.params.id });
    res.json({ message: 'Department deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Department Detail — semester overview ─────────────────────

// GET /api/college-admin/departments/:id/overview
// Returns semesters with student counts, subjects, and mentor info per batch
exports.getDepartmentOverview = async (req, res) => {
  try {
    const dept = await Department.findOne({ _id: req.params.id, college: req.college }).lean();
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    // Get all subjects for this department
    const subjects = await Subject.find({ department: dept._id })
      .populate('faculty', 'name email')
      .sort({ semester: 1, name: 1 }).lean();

    // Get student counts per semester
    const studentCounts = await Student.aggregate([
      { $match: { college: req.college, department: dept.name } },
      { $group: { _id: '$semester', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    studentCounts.forEach(s => { countMap[s._id] = s.count; });

    // Get unique batchYears with their mentor info
    const batches = await Student.aggregate([
      { $match: { college: req.college, department: dept.name } },
      { $group: {
        _id: { batchYear: '$batchYear', semester: '$semester' },
        count: { $sum: 1 },
        mentor: { $first: '$facultyMentor' },
      }},
    ]);

    // Populate mentor names
    const mentorIds = [...new Set(batches.map(b => b.mentor).filter(Boolean))];
    const mentors = await User.find({ _id: { $in: mentorIds } }).select('name email').lean();
    const mentorMap = {};
    mentors.forEach(m => { mentorMap[m._id.toString()] = m; });

    const batchesWithMentors = batches.map(b => ({
      batchYear: b._id.batchYear || '—',
      semester: b._id.semester,
      studentCount: b.count,
      mentor: b.mentor ? mentorMap[b.mentor.toString()] || null : null,
    }));

    // Build semester array
    const semesters = [];
    for (let sem = 1; sem <= dept.totalSemesters; sem++) {
      semesters.push({
        semester: sem,
        studentCount: countMap[sem] || 0,
        subjects: subjects.filter(s => s.semester === sem),
        batches: batchesWithMentors.filter(b => b.semester === sem),
      });
    }

    res.json({ department: dept, semesters });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Subjects CRUD ─────────────────────────────────────────────

// POST /api/college-admin/departments/:id/subjects
exports.createSubject = async (req, res) => {
  try {
    const { name, semester } = req.body;
    if (!name || !semester) return res.status(400).json({ error: 'name and semester required' });

    const dept = await Department.findOne({ _id: req.params.id, college: req.college });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    if (Number(semester) < 1 || Number(semester) > dept.totalSemesters)
      return res.status(400).json({ error: `Semester must be between 1 and ${dept.totalSemesters}` });

    const subject = await Subject.create({
      name, department: dept._id,
      semester: Number(semester), college: req.college,
    });
    res.status(201).json({ message: `Subject "${name}" added to Sem ${semester}`, subject });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Subject already exists for this semester' });
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/college-admin/subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    const { name, semester } = req.body;
    const update = {};
    if (name)     update.name     = name;
    if (semester) update.semester = Number(semester);
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, college: req.college }, update, { new: true }
    ).populate('faculty', 'name email').lean();
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// DELETE /api/college-admin/subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, college: req.college });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Assign Faculty to Subject ─────────────────────────────────

// PUT /api/college-admin/subjects/:id/assign-faculty
exports.assignFacultyToSubject = async (req, res) => {
  try {
    const { facultyId } = req.body;
    if (!facultyId) return res.status(400).json({ error: 'facultyId required' });

    // Verify faculty belongs to same college
    const faculty = await User.findOne({
      _id: facultyId,
      college: req.college,
      role: { $in: ['faculty', 'subject_coordinator', 'mentor'] },
    });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found in your college' });

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, college: req.college },
      { faculty: facultyId },
      { new: true }
    ).populate('faculty', 'name email').lean();
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    // Also add this subject name to faculty's subjects array
    await User.findByIdAndUpdate(facultyId, { $addToSet: { subjects: subject.name } });

    res.json({ message: `${faculty.name} assigned to ${subject.name}`, subject });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Assign Mentor to Batch ────────────────────────────────────

// POST /api/college-admin/departments/:id/assign-mentor
// Body: { mentorId, batchYear, change: true/false }
// change=true allows replacing an existing mentor on this batch
exports.assignMentorToBatch = async (req, res) => {
  try {
    const { mentorId, batchYear, change } = req.body;
    if (!mentorId || !batchYear) return res.status(400).json({ error: 'mentorId and batchYear required' });

    const dept = await Department.findOne({ _id: req.params.id, college: req.college });
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    // Verify faculty/mentor belongs to same college
    const mentor = await User.findOne({
      _id: mentorId, college: req.college,
      role: { $in: ['faculty', 'subject_coordinator', 'mentor'] },
    });
    if (!mentor) return res.status(404).json({ error: 'Faculty/Mentor not found in your college' });

    // ── Validation 1: Check if this batch already has a mentor ──
    const existingMentorStudent = await Student.findOne({
      college: req.college, department: dept.name, batchYear,
      facultyMentor: { $exists: true, $ne: null },
    }).populate('facultyMentor', 'name').lean();

    if (existingMentorStudent && existingMentorStudent.facultyMentor) {
      // Batch already has a mentor
      if (!change) {
        return res.status(400).json({
          error: `Batch ${batchYear} already has mentor "${existingMentorStudent.facultyMentor.name}". Use "Change Mentor" to replace.`,
        });
      }
      // If changing AND assigning the same mentor again, reject
      if (existingMentorStudent.facultyMentor._id.toString() === mentorId) {
        return res.status(400).json({
          error: `"${mentor.name}" is already the mentor of batch ${batchYear}.`,
        });
      }
    }

    // ── Validation 2: Mentor can't be assigned to multiple batches ──
    const mentorAlreadyAssigned = await Student.findOne({
      college: req.college,
      facultyMentor: mentorId,
      $or: [
        { batchYear: { $ne: batchYear } },
        { department: { $ne: dept.name } },
      ],
    }).lean();

    if (mentorAlreadyAssigned) {
      return res.status(400).json({
        error: `"${mentor.name}" is already assigned as mentor to batch ${mentorAlreadyAssigned.batchYear} in ${mentorAlreadyAssigned.department}. A mentor can only be assigned to one batch.`,
      });
    }

    // ── If changing: clear old mentor's batch assignment ──
    if (change && existingMentorStudent?.facultyMentor) {
      const oldMentorId = existingMentorStudent.facultyMentor._id;
      // Only clear if old mentor is different from new
      if (oldMentorId.toString() !== mentorId) {
        // Check if old mentor is assigned to any other batch
        const otherBatch = await Student.findOne({
          college: req.college,
          facultyMentor: oldMentorId,
          $or: [
            { batchYear: { $ne: batchYear } },
            { department: { $ne: dept.name } },
          ],
        }).lean();
        if (!otherBatch) {
          // Just clear the batch metadata — do NOT change the role
          await User.findByIdAndUpdate(oldMentorId, { $unset: { batch: '' } });
        }
      }
    }

    // ── Assign mentor to all students in this batch ──
    const result = await Student.updateMany(
      { college: req.college, department: dept.name, batchYear },
      { facultyMentor: mentorId }
    );

    // Store batch metadata — do NOT change the role (faculty can be mentor simultaneously)
    const mentorUpdate = { department: dept.name, batch: parseInt(batchYear.split('-')[0], 10) };
    await User.findByIdAndUpdate(mentorId, mentorUpdate);

    res.json({
      message: `Mentor ${mentor.name} assigned to batch ${batchYear} (${result.modifiedCount} students updated)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Promote Students ──────────────────────────────────────────

// POST /api/college-admin/departments/:id/promote
exports.promoteStudents = async (req, res) => {
  try {
    const { fromSemester } = req.body;
    if (!fromSemester) return res.status(400).json({ error: 'fromSemester required' });

    const dept = await Department.findOne({ _id: req.params.id, college: req.college });
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    const toSemester = Number(fromSemester) + 1;
    if (toSemester > dept.totalSemesters)
      return res.status(400).json({ error: `Cannot promote beyond Sem ${dept.totalSemesters} (final semester)` });

    const result = await Student.updateMany(
      { college: req.college, department: dept.name, semester: Number(fromSemester) },
      { semester: toSemester }
    );

    res.json({
      message: `${result.modifiedCount} students promoted from Sem ${fromSemester} to Sem ${toSemester}`,
      promoted: result.modifiedCount,
      fromSemester: Number(fromSemester),
      toSemester,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Get available faculty/mentors for assignment ──────────────

// GET /api/college-admin/faculty-list
exports.getFacultyList = async (req, res) => {
  try {
    const faculty = await User.find({
      college: req.college,
      role: { $in: ['faculty', 'subject_coordinator', 'mentor'] },
    }).select('name email role department subjects division batch').sort({ name: 1 }).lean();
    res.json(faculty);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
