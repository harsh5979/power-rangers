const Student = require('../models/Student');
const { calculateRisk } = require('../services/riskService');

// POST /api/risk/calculate/:studentId
exports.calculateStudentRisk = async (req, res) => {
  try {
    const result = await calculateRisk(req.params.studentId);
    if (!result) return res.status(404).json({ error: 'Student not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/risk/calculate-all
exports.calculateAllRisk = async (req, res) => {
  try {
    const students = await Student.find({ college: req.college }, '_id').lean();
    await Promise.all(students.map(s => calculateRisk(s._id)));
    res.json({ updated: students.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/risk/summary
// Mentor: sees risk summary for ONLY their assigned batch students
// Faculty: sees risk for students in their assigned subjects
// Principal/CollegeAdmin: sees all
exports.riskSummary = async (req, res) => {
  try {
    let filter = {};

    if (req.role === 'admin') {
      filter = {};
    } else if (req.role === 'mentor') {
      // Mentor sees risk for ALL their assigned students (entire batch)
      filter = { college: req.college, facultyMentor: req.user };
    } else if (req.role === 'subject_coordinator') {
      // Faculty sees risk for students in their assigned subjects
      const Subject = require('../models/Subject');
      const assignedSubjects = await Subject.find({ college: req.college, faculty: req.user })
        .populate('department', 'name').lean();
      if (assignedSubjects.length > 0) {
        const deptSemPairs = assignedSubjects.map(s => ({
          department: s.department?.name, semester: s.semester,
        })).filter(p => p.department);
        if (deptSemPairs.length > 0) {
          filter = { college: req.college, $or: deptSemPairs.map(p => ({ department: p.department, semester: p.semester })) };
        } else {
          filter = { college: req.college, facultyMentor: req.user };
        }
      } else {
        filter = { college: req.college, facultyMentor: req.user };
      }
    } else {
      // principal, college_admin
      filter = { college: req.college };
    }

    const [total, high, medium, low] = await Promise.all([
      Student.countDocuments(filter),
      Student.countDocuments({ ...filter, riskLevel: 'high' }),
      Student.countDocuments({ ...filter, riskLevel: 'medium' }),
      Student.countDocuments({ ...filter, riskLevel: 'low' }),
    ]);
    res.json({ total, high, medium, low });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
