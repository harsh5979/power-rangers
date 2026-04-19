const User    = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const { createUser } = require('../services/userService');

// ── College Admins ────────────────────────────────────────────
exports.getCollegeAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 9 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      User.find({ role: 'principal' }).select('name email college createdAt lastLogin')
        .skip(skip).limit(Number(limit)).lean(),
      User.countDocuments({ role: 'principal' }),
    ]);
    res.json({ data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createCollegeAdmin = async (req, res) => {
  try {
    const { name, email, college } = req.body;
    if (!name || !email || !college) return res.status(400).json({ error: 'name, email, college required' });

    // Create college record (upsert)
    await College.findOneAndUpdate({ name: college }, { name: college }, { upsert: true, new: true });

    const user = await createUser({ name, email, role: 'principal', college });
    res.status(201).json({ message: `College admin created. Credentials sent to ${email}`, user: { id: user._id, name: user.name, email: user.email, college: user.college } });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
};

exports.deleteCollegeAdmin = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'principal' });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Keep principal endpoints for backward compat
exports.getPrincipals = async (req, res) => {
  try {
    const { page = 1, limit = 9 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      User.find({ role: 'principal' }).select('name email college createdAt lastLogin')
        .skip(skip).limit(Number(limit)).lean(),
      User.countDocuments({ role: 'principal' }),
    ]);
    res.json({ data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createPrincipal = async (req, res) => {
  try {
    const { name, email, college } = req.body;
    if (!name || !email || !college) return res.status(400).json({ error: 'name, email, college required' });
    const user = await createUser({ name, email, role: 'principal', college });
    res.status(201).json({ message: `Principal created. Credentials sent to ${email}`, user: { id: user._id, name: user.name, email: user.email, college: user.college } });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
};

exports.deletePrincipal = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'principal' });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── College management ────────────────────────────────────────
exports.getColleges = async (req, res) => {
  try {
    const colleges = await College.find().lean();
    res.json(colleges);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateCollege = async (req, res) => {
  try {
    const { branches, semesterDurationMonths, currentAcademicYear } = req.body;
    const college = await College.findByIdAndUpdate(req.params.id, { branches, semesterDurationMonths, currentAcademicYear }, { new: true });
    if (!college) return res.status(404).json({ error: 'College not found' });
    res.json(college);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Auto-semester update ──────────────────────────────────────
// POST /api/admin/auto-semester
// Calculates semester from enrollmentYear and semesterDurationMonths, updates all students
exports.autoUpdateSemesters = async (req, res) => {
  try {
    const colleges = await College.find().lean();
    let updated = 0;

    for (const col of colleges) {
      const monthsPerSem  = col.semesterDurationMonths || 6;   // GTU = 6 months
      const maxSem        = col.totalSemesters || 8;           // GTU = 8 sems
      const students = await Student.find({ college: col.name, enrollmentYear: { $exists: true } }).lean();

      for (const s of students) {
        // GTU academic year starts July 1
        const startDate    = new Date(`${s.enrollmentYear}-07-01`);
        const monthsElapsed = (new Date() - startDate) / (1000 * 60 * 60 * 24 * 30);
        const newSem = Math.min(Math.max(Math.ceil(monthsElapsed / monthsPerSem), 1), maxSem);
        if (newSem !== s.semester) {
          await Student.findByIdAndUpdate(s._id, { semester: newSem });
          updated++;
        }
      }
    }

    res.json({ message: `Updated ${updated} students` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
