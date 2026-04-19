const Intervention = require('../models/Intervention');
const Student = require('../models/Student');

// POST /api/interventions
exports.logIntervention = async (req, res) => {
  try {
    const { studentId, type, remarks } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const intervention = await Intervention.create({
      student: studentId,
      conductedBy: req.user,
      type,
      remarks,
      preRiskScore: student.riskScore,
    });
    res.status(201).json(intervention);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/interventions/:studentId
exports.getStudentInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find({ student: req.params.studentId })
      .populate('conductedBy', 'name role')
      .sort({ date: -1 });
    res.json(interventions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/interventions/:id/close  — update postRiskScore and close
exports.closeIntervention = async (req, res) => {
  try {
    const { postRiskScore } = req.body;
    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      { status: 'closed', postRiskScore },
      { new: true }
    );
    res.json(intervention);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/interventions/my  — faculty's own interventions
exports.myInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find({ conductedBy: req.user })
      .populate('student', 'name rollNumber riskLevel')
      .sort({ date: -1 });
    res.json(interventions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
