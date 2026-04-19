const Marks = require('../models/Marks');
const { calculateRisk } = require('../services/riskService');

// POST /api/marks  — bulk upload (upsert: update if exists)
exports.uploadMarks = async (req, res) => {
  try {
    const { records } = req.body; // [{studentId, subject, examType, marksObtained, totalMarks, semester}]
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (const r of records) {
      // Check if trying to edit old record
      const existing = await Marks.findOne({
        student: r.studentId,
        subject: r.subject,
        examType: r.examType,
        semester: r.semester,
      });
      
      if (existing && existing.createdAt < oneDayAgo) {
        return res.status(403).json({ error: 'Cannot edit marks older than 1 day' });
      }
      
      // Upsert: update if exists, insert if new
      await Marks.findOneAndUpdate(
        {
          student: r.studentId,
          subject: r.subject,
          examType: r.examType,
          semester: r.semester,
        },
        {
          marksObtained: r.marksObtained,
          totalMarks: r.totalMarks,
          uploadedBy: req.user,
        },
        { upsert: true, new: true }
      );
    }
    
    const uniqueStudents = [...new Set(records.map(r => r.studentId))];
    await Promise.all(uniqueStudents.map(id => calculateRisk(id)));
    res.status(201).json({ message: 'Marks saved', count: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/marks/:studentId
exports.getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.params.studentId }).sort({ createdAt: -1 });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/marks/subject/:subject  — coordinator view
exports.getSubjectMarks = async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = { subject: req.params.subject };
    if (semester) filter.semester = Number(semester);
    const marks = await Marks.find(filter).populate('student', 'name rollNumber');
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
