const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Intervention = require('../models/Intervention');

// GET /api/reports/at-risk  — CSV/JSON export
exports.atRiskReport = async (req, res) => {
  try {
    const { format = 'json', riskLevel, department } = req.query;
    const filter = {};
    if (riskLevel) filter.riskLevel = riskLevel;
    if (department) filter.department = department;

    const students = await Student.find(filter)
      .populate('facultyMentor', 'name email')
      .sort({ riskScore: -1 });

    if (format === 'csv') {
      const rows = [
        'Roll No,Name,Department,Semester,Risk Score,Risk Level,Factors,Mentor',
        ...students.map(s => [
          s.rollNumber, s.name, s.department, s.semester,
          s.riskScore, s.riskLevel,
          `"${s.riskFactors.map(f => f.factor).join(' | ')}"`,
          s.facultyMentor?.name || 'Unassigned',
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=at-risk-report.csv');
      return res.send(rows);
    }

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/reports/student/:id  — full student report
exports.studentReport = async (req, res) => {
  try {
    const [student, attendance, marks, interventions] = await Promise.all([
      Student.findById(req.params.id).populate('facultyMentor', 'name email'),
      Attendance.find({ student: req.params.id }),
      Marks.find({ student: req.params.id }),
      Intervention.find({ student: req.params.id }).populate('conductedBy', 'name'),
    ]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Attendance summary
    const attSummary = {};
    attendance.forEach(a => {
      if (!attSummary[a.subject]) attSummary[a.subject] = { total: 0, present: 0 };
      attSummary[a.subject].total++;
      if (a.status === 'present') attSummary[a.subject].present++;
    });

    res.json({ student, attendanceSummary: attSummary, marks, interventions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/reports/comprehensive
exports.comprehensiveReport = async (req, res) => {
  try {
    const students = await Student.find({ college: req.college })
      .select('name rollNumber department semester riskScore riskLevel')
      .sort({ department: 1, semester: 1, name: 1 })
      .lean();

    const reportData = {};
    for (const s of students) {
      if (!reportData[s.department]) reportData[s.department] = {};
      if (!reportData[s.department][s.semester]) {
        reportData[s.department][s.semester] = { 
          students: [], 
          stats: { total: 0, high: 0, medium: 0, low: 0, avgRisk: 0, sumRisk: 0 } 
        };
      }
      
      const semObj = reportData[s.department][s.semester];
      semObj.students.push(s);
      semObj.stats.total++;
      if (s.riskLevel) semObj.stats[s.riskLevel]++;
      if (s.riskScore) semObj.stats.sumRisk += s.riskScore;
    }
    
    // Calculate averages
    for (const dept in reportData) {
      for (const sem in reportData[dept]) {
        const o = reportData[dept][sem];
        if (o.stats.total > 0) {
          o.stats.avgRisk = Math.round(o.stats.sumRisk / o.stats.total);
        }
      }
    }

    res.json({ college: req.college, reportData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
