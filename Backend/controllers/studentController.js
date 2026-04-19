const Student = require('../models/Student');
const User    = require('../models/User');
const { createUser } = require('../services/userService');

// ── Batch year → semester auto-calculation ────────────────────
// batchYear = '2024-25' → admissionStartYear = 2024
// Academic year: June–May.  Jun–Nov = odd sem, Dec–May = even sem
function calcSemesterFromBatchYear(batchYear) {
  if (!batchYear) return null;
  const admStartYear = parseInt(batchYear.split('-')[0], 10);
  if (isNaN(admStartYear)) return null;

  const now   = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year  = now.getFullYear();

  // Academic year starts in June. If current month >= June, acadStartYear = year, else year - 1
  const currentAcadStartYear = month >= 6 ? year : year - 1;
  const currentYear = currentAcadStartYear - admStartYear + 1;
  if (currentYear < 1) return 1;

  // Jun–Nov = first half (odd sem), Dec–May = second half (even sem)
  const isSecondHalf = month >= 12 || month <= 5;
  const semester = (currentYear - 1) * 2 + (isSecondHalf ? 2 : 1);
  return semester;
}

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const { department, semester, riskLevel, search, division, branch, page = 1, limit = 9 } = req.query;
    const filter = { college: req.college };
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);
    if (riskLevel)  filter.riskLevel  = riskLevel;
    if (division)   filter.division   = division;
    if (branch)     filter.branch     = branch;

    // ── Role-based scoping ──
    // Mentor: sees ALL assigned batch students (across all subjects/semesters)
    if (req.role === 'mentor') {
      filter.facultyMentor = req.user;
    }
    // Faculty: sees only students in their assigned subjects' department+semester
    else if (req.role === 'faculty') {
      const Subject = require('../models/Subject');
      const Department = require('../models/Department');
      const assignedSubjects = await Subject.find({ college: req.college, faculty: req.user })
        .populate('department', 'name').lean();
      if (assignedSubjects.length > 0) {
        // Build OR filter for each dept+semester combo the faculty teaches
        const deptSemPairs = assignedSubjects.map(s => ({
          department: s.department?.name, semester: s.semester,
        })).filter(p => p.department);
        if (deptSemPairs.length > 0 && !department && !semester) {
          filter.$or = [
            ...(filter.$or || []),
            ...deptSemPairs.map(p => ({ department: p.department, semester: p.semester })),
          ];
        }
      } else {
        // Fallback: faculty with no assigned subjects sees students they mentor
        filter.facultyMentor = req.user;
      }
    }

    if (search) {
      const searchFilter = [
        { name:       { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
      if (filter.$or) {
        // Combine existing $or with search $or using $and
        filter.$and = [{ $or: filter.$or }, { $or: searchFilter }];
        delete filter.$or;
      } else {
        filter.$or = searchFilter;
      }
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Student.find(filter).populate('facultyMentor', 'name email')
        .sort({ riskScore: -1 }).skip(skip).limit(Number(limit)).lean(),
      Student.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/students/my-profile
exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).populate('studentProfile').lean();
    if (!user?.studentProfile) return res.status(404).json({ error: 'Profile not found' });
    res.json(user.studentProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('facultyMentor', 'name email').lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, department, semester, batch, batchYear } = req.body;
    if (!name || !email || !rollNumber || !department)
      return res.status(400).json({ error: 'name, email, rollNumber, department required' });

    // Auto-calculate semester from batchYear if semester not provided
    const finalSemester = semester ? Number(semester) : (calcSemesterFromBatchYear(batchYear) || 1);

    // Upsert user
    let user = await User.findOne({ email });
    if (!user) {
      user = await createUser({ name, email, role: 'student', college: req.college, department });
    } else {
      await User.findByIdAndUpdate(user._id, { name, department, college: req.college });
    }

    const student = await Student.findOneAndUpdate(
      { rollNumber },
      { $set: { userId: user._id, name, email, college: req.college, department, semester: finalSemester, batch, batchYear } },
      { upsert: true, new: true }
    );

    // parallel updates
    await Promise.all([
      User.findByIdAndUpdate(user._id, { studentProfile: student._id }),
      User.findByIdAndUpdate(req.user, { $addToSet: { assignedStudents: student._id } }),
    ]);

    res.status(201).json({ message: `Student created. Credentials sent to ${email}`, student });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// POST /api/students/bulk
exports.bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || !students.length)
      return res.status(400).json({ error: 'students array required' });

    const results = await Promise.allSettled(
      students.map(async s => {
        const finalSem = s.semester ? Number(s.semester) : (calcSemesterFromBatchYear(s.batchYear) || 1);

        // Upsert user — update if email exists, create if not
        let user = await User.findOne({ email: s.email });
        if (!user) {
          user = await createUser({
            name: s.name, email: s.email,
            role: 'student', college: req.college, department: s.department,
          });
        } else {
          await User.findByIdAndUpdate(user._id, {
            name: s.name, department: s.department, college: req.college,
          });
        }

        // Upsert student — update if rollNumber exists, create if not
        const studentData = {
          userId: user._id, name: s.name, email: s.email,
          college: req.college, department: s.department,
          semester: finalSem, batch: s.batch, batchYear: s.batchYear,
          division: s.division,
        };
        const student = await Student.findOneAndUpdate(
          { rollNumber: s.rollNumber },
          { $set: studentData },
          { upsert: true, new: true }
        );

        await Promise.all([
          User.findByIdAndUpdate(user._id, { studentProfile: student._id }),
          User.findByIdAndUpdate(req.user, { $addToSet: { assignedStudents: student._id } }),
        ]);
        return s.email;
      })
    );

    const created = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed  = results.filter(r => r.status === 'rejected')
      .map((r, i) => ({ email: students[i]?.email, reason: r.reason?.message }));

    res.status(201).json({ message: `${created.length} created/updated, ${failed.length} failed`, created, failed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/students/:id/assign-mentor
exports.assignMentor = async (req, res) => {
  try {
    const { mentorId } = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, { facultyMentor: mentorId }, { new: true });
    await User.findByIdAndUpdate(mentorId, { $addToSet: { assignedStudents: student._id } });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { name, department, semester, batch, batchYear } = req.body;
    const update = {};
    if (name)                   update.name       = name;
    if (department)             update.department = department;
    if (semester)               update.semester   = Number(semester);
    if (batch    !== undefined) update.batch      = batch;
    if (batchYear !== undefined) update.batchYear = batchYear;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, college: req.college }, update, { new: true }
    ).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (name) await User.findByIdAndUpdate(student.userId, { name });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, college: req.college });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    await Promise.all([
      student.userId ? User.findByIdAndDelete(student.userId) : Promise.resolve(),
      User.updateMany({ assignedStudents: req.params.id }, { $pull: { assignedStudents: req.params.id } }),
    ]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkDeleteStudents = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
    const students = await Student.find({ _id: { $in: ids }, college: req.college }).select('_id userId').lean();
    const userIds = students.map(s => s.userId).filter(Boolean);
    await Promise.all([
      Student.deleteMany({ _id: { $in: ids }, college: req.college }),
      userIds.length ? User.deleteMany({ _id: { $in: userIds } }) : Promise.resolve(),
      User.updateMany({ assignedStudents: { $in: ids } }, { $pull: { assignedStudents: { $in: ids } } }),
    ]);
    res.json({ message: `${students.length} students deleted` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};