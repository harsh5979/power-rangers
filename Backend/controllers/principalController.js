const User    = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const { createUser } = require('../services/userService');

// GET /api/principal/faculty
exports.getFaculty = async (req, res) => {
  try {
    const { page = 1, limit = 9, search } = req.query;
    const filter = { role: { $in: ['faculty', 'mentor', 'subject_coordinator'] }, college: req.college };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      User.find(filter).select('name email role department subjects division branch batch createdAt').skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/principal/faculty
exports.createFaculty = async (req, res) => {
  try {
    const { name, email, role = 'faculty', department, subjects = [], division, branch, batch } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    if (!['faculty', 'mentor', 'subject_coordinator'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const user = await createUser({ name, email, role, college: req.college, department, subjects });

    // Set division, branch, batch on user
    const extra = {};
    if (division !== undefined) extra.division = division;
    if (branch   !== undefined) extra.branch   = branch;
    if (batch    !== undefined) extra.batch     = Number(batch);
    if (Object.keys(extra).length) await User.findByIdAndUpdate(user._id, extra);

    // Mentor: auto-assign students matching batch + branch + division
    if (role === 'mentor') {
      const filter = { college: req.college };
      if (batch)    filter.enrollmentYear = Number(batch);
      if (branch)   filter.branch         = branch;
      if (division) filter.division       = division;

      const divStudents = await Student.find(filter).select('_id').lean();
      if (divStudents.length) {
        const ids = divStudents.map(s => s._id);
        await Promise.all([
          Student.updateMany({ _id: { $in: ids } }, { facultyMentor: user._id }),
          User.findByIdAndUpdate(user._id, { assignedStudents: ids }),
        ]);
      }
    }

    res.status(201).json({ message: `Created. Credentials sent to ${email}`, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
};

// PATCH /api/principal/faculty/:id
exports.updateFaculty = async (req, res) => {
  try {
    const { name, department, subjects, division, branch } = req.body;
    const update = {};
    if (name)       update.name       = name;
    if (department) update.department = department;
    if (subjects)   update.subjects   = subjects;
    if (division !== undefined) update.division = division;
    if (branch   !== undefined) update.branch   = branch;

    const user = await User.findOneAndUpdate({ _id: req.params.id, college: req.college }, update, { new: true })
      .select('name email role department subjects division branch').lean();
    if (!user) return res.status(404).json({ error: 'Not found' });

    // Re-assign division students if division changed
    if (division !== undefined) {
      await Student.updateMany({ college: req.college, facultyMentor: req.params.id }, { $unset: { facultyMentor: '' } });
      if (division) {
        const divStudents = await Student.find({ college: req.college, division }).select('_id').lean();
        const ids = divStudents.map(s => s._id);
        await Promise.all([
          Student.updateMany({ _id: { $in: ids } }, { facultyMentor: req.params.id }),
          User.findByIdAndUpdate(req.params.id, { assignedStudents: ids }),
        ]);
      }
    }

    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// DELETE /api/principal/faculty/:id
exports.deleteFaculty = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, college: req.college });
    if (!user) return res.status(404).json({ error: 'Not found' });
    await Student.updateMany({ facultyMentor: req.params.id }, { $unset: { facultyMentor: '' } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/principal/faculty/:id/resend-credentials
exports.resendCredentials = async (req, res) => {
  try {
    const { generatePassword } = require('../services/userService');
    const bcrypt = require('bcrypt');
    const { sendWelcomeWithPassword } = require('../services/mail.services');

    const user = await User.findOne({ _id: req.params.id, college: req.college });
    if (!user) return res.status(404).json({ error: 'Not found' });

    const rawPassword = generatePassword();
    user.password = await bcrypt.hash(rawPassword, 10);
    await user.save();

    await sendWelcomeWithPassword(user.email, user.name, user.role, rawPassword);
    res.json({ message: `New credentials sent to ${user.email}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/principal/college-info
exports.getCollegeInfo = async (req, res) => {
  try {
    const Department = require('../models/Department');
    const Subject    = require('../models/Subject');
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
    // Map by department name for frontend
    const subjectsByDeptName = {};
    for (const d of deptDocs) {
      subjectsByDeptName[d.name] = subjectsByDept[d._id.toString()] || [];
    }
    res.json({
      ...(college || { name: req.college }),
      departments,
      subjectsByDepartment: subjectsByDeptName,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
