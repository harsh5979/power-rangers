const Attendance = require('../models/Attendance');
const { calculateRisk } = require('../services/riskService');

// POST /api/attendance  — bulk mark (upsert: update if exists for same date)
exports.markAttendance = async (req, res) => {
  try {
    const { records } = req.body; // [{studentId, subject, date, status}]
    
    // Check if any record is older than 1 day
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (const r of records) {
      const recordDate = new Date(r.date);
      
      // Check if trying to edit old record
      const existing = await Attendance.findOne({
        student: r.studentId,
        subject: r.subject,
        date: recordDate,
      });
      
      if (existing && existing.date < oneDayAgo) {
        return res.status(403).json({ error: 'Cannot edit attendance older than 1 day' });
      }
      
      // Upsert: update if exists for same date, insert if new
      await Attendance.findOneAndUpdate(
        {
          student: r.studentId,
          subject: r.subject,
          date: recordDate,
        },
        {
          status: r.status,
          markedBy: req.user,
        },
        { upsert: true, new: true }
      );
    }
    
    // Recalculate risk for affected students
    const uniqueStudents = [...new Set(records.map(r => r.studentId))];
    await Promise.all(uniqueStudents.map(id => calculateRisk(id)));
    
    res.status(201).json({ message: 'Attendance saved', count: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/attendance/:studentId
exports.getStudentAttendance = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = { student: req.params.studentId };
    if (subject) filter.subject = subject;
    const records = await Attendance.find(filter).sort({ date: -1 });

    // Summary per subject
    const summary = {};
    records.forEach(r => {
      if (!summary[r.subject]) summary[r.subject] = { total: 0, present: 0 };
      summary[r.subject].total++;
      if (r.status === 'present') summary[r.subject].present++;
    });
    Object.keys(summary).forEach(s => {
      summary[s].percentage = ((summary[s].present / summary[s].total) * 100).toFixed(1);
    });

    res.json({ records, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
