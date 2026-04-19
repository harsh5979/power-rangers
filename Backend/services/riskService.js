/**
 * riskService.js
 * Pure risk calculation logic — ported from FutureModel.py
 * No HTTP, no Express. Only data in, result out.
 */

const Student    = require('../models/Student');
const Marks      = require('../models/Marks');
const Attendance = require('../models/Attendance');
const Alert      = require('../models/Alert');

// ── Constants (match FutureModel.py weights) ─────────────────
const WEIGHTS  = { marks: 50, assignment: 30, attendance: 20 };
const PASSING  = 40;   // marks % threshold
const ATT_MIN  = 75;   // attendance % threshold for flagging

// ── predict_marks (FutureModel.py) ───────────────────────────
function predictMarks(history) {
  if (history.length < 2) return history[0] ?? 0;
  const n = history.length;
  const slope = (history[n - 1] - history[0]) / n;
  return history[n - 1] + slope;
}

// ── calculate_current_risk (FutureModel.py) ───────────────────
function calcCurrentRisk(attendancePct, avgMarks, assignmentScore) {
  const attRisk    = WEIGHTS.attendance * (1 - attendancePct / 100);
  const assignRisk = WEIGHTS.assignment * (1 - assignmentScore);
  const marksRisk  = avgMarks < PASSING
    ? WEIGHTS.marks
    : WEIGHTS.marks * (1 - (avgMarks - PASSING) / (100 - PASSING));
  return round(Math.min(attRisk + assignRisk + marksRisk, 100));
}

// ── calculate_future_risk (FutureModel.py) ────────────────────
function calcFutureRisk(marksHistory, attendanceHistory, assignmentScore) {
  const predicted  = predictMarks(marksHistory);
  const marksRisk  = predicted < PASSING
    ? WEIGHTS.marks
    : WEIGHTS.marks * (1 - (predicted - PASSING) / (100 - PASSING));

  const avgAtt     = avg(attendanceHistory) ?? 100;
  const attRisk    = WEIGHTS.attendance * (1 - avgAtt / 100);

  const assignRisk = WEIGHTS.assignment * (1 - assignmentScore);

  return {
    futureRisk:     round(Math.min(marksRisk + attRisk + assignRisk, 100)),
    predictedMarks: round(predicted),
  };
}

// ── get_risk_level (FutureModel.py) ──────────────────────────
function getRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ── Helpers ───────────────────────────────────────────────────
const round = n => Math.round(n * 100) / 100;
const avg   = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

// ── Main: calculate risk for one student ─────────────────────
async function calculateRisk(studentId) {
  const student = await Student.findById(studentId);
  if (!student) return null;

  // 1. Attendance
  const attRecords   = await Attendance.find({ student: studentId }).lean();
  const presentCount = attRecords.filter(r => r.status === 'present').length;
  const attendancePct = attRecords.length > 0
    ? (presentCount / attRecords.length) * 100
    : 100;

  // 2. Marks
  const allMarks      = await Marks.find({ student: studentId }).sort({ createdAt: 1 }).lean();
  const internals     = allMarks.filter(m => ['internal1', 'internal2'].includes(m.examType));
  const assignments   = allMarks.filter(m => m.examType === 'assignment');

  const marksHistory  = internals.map(m => (m.marksObtained / m.totalMarks) * 100);
  const avgMarks      = marksHistory.length ? avg(marksHistory) : 100;

  const assignHistory = assignments.map(m => m.marksObtained / m.totalMarks >= 0.5 ? 1 : 0);
  const assignmentScore = assignHistory.length === 0 ? 1 : avg(assignHistory);

  // 3. Current risk
  const currentRisk = calcCurrentRisk(attendancePct, avgMarks, assignmentScore);

  // 4. Future risk (needs ≥2 marks data points)
  const { futureRisk, predictedMarks } = marksHistory.length >= 2
    ? calcFutureRisk(marksHistory, [attendancePct], assignmentScore)
    : { futureRisk: currentRisk, predictedMarks: avgMarks };

  // 5. Overall = worst case
  const overallRisk = Math.max(currentRisk, futureRisk);
  const level       = getRiskLevel(overallRisk);

  // 6. Explainable factors
  const factors = [];
  if (attendancePct < ATT_MIN)
    factors.push({ factor: `Low attendance: ${attendancePct.toFixed(1)}%`, weight: WEIGHTS.attendance });
  if (avgMarks < PASSING)
    factors.push({ factor: `Marks below passing: ${avgMarks.toFixed(1)}%`, weight: WEIGHTS.marks });
  if (assignmentScore < 1)
    factors.push({ factor: `Incomplete/failed assignments: ${((1 - assignmentScore) * 100).toFixed(0)}%`, weight: WEIGHTS.assignment });
  if (predictedMarks < PASSING && marksHistory.length >= 2)
    factors.push({ factor: `Predicted marks declining: ${predictedMarks.toFixed(1)}%`, weight: WEIGHTS.marks });

  // 7. Persist to student
  await Student.findByIdAndUpdate(studentId, {
    riskScore: overallRisk,
    riskLevel: level,
    riskFactors: factors,
    lastRiskCalculated: new Date(),
  });

  // 8. Auto-alert mentor if at risk
  if (level !== 'low' && student.facultyMentor) {
    const alreadyAlerted = await Alert.findOne({ student: studentId, isRead: false, riskLevel: level });
    if (!alreadyAlerted) {
      await Alert.create({
        student:   studentId,
        recipient: student.facultyMentor,
        riskLevel: level,
        message:   `${student.name} is at ${level} risk (score: ${overallRisk}). ${factors.map(f => f.factor).join('; ')}`,
      });
    }
  }

  return { currentRisk, futureRisk, predictedMarks, overallRisk, riskLevel: level, riskFactors: factors };
}

module.exports = { calculateRisk, getRiskLevel, calcCurrentRisk, calcFutureRisk, predictMarks };
