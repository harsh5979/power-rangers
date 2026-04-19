const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  examType: { type: String, enum: ['internal1', 'internal2', 'assignment', 'practical', 'external'], required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  semester: { type: Number },
}, { timestamps: true });

marksSchema.index({ student: 1, subject: 1, examType: 1 });

module.exports = mongoose.model('Marks', marksSchema);
