const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rollNumber:     { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  email:          { type: String, required: true },
  college:        { type: String, required: true },
  branch:         { type: String },                        // CE, IT, ME etc.
  department:     { type: String, required: true },
  enrollmentYear: { type: Number },                        // e.g. 2022 — used for auto-semester
  semester:       { type: Number, required: true },
  division:       { type: String },                        // A, B, C
  batch:          { type: String },
  batchYear:      { type: String },                        // e.g. '2024-25' — admission year
  facultyMentor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  riskScore:      { type: Number, default: 0 },
  riskLevel:      { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  riskFactors:    [{ factor: String, weight: Number }],
  lastRiskCalculated: { type: Date },
}, { timestamps: true });

studentSchema.index({ college: 1, branch: 1, division: 1 });
studentSchema.index({ college: 1, department: 1 });
studentSchema.index({ facultyMentor: 1 });
studentSchema.index({ riskLevel: 1 });

module.exports = mongoose.model('Student', studentSchema);
