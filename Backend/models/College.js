const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  branches:    [{ type: String }],   // e.g. ['CE', 'IT', 'ME', 'EC']
  departments: [{ type: String }],   // e.g. ['Computer Engineering', 'IT', 'Mechanical']
  semesterDurationMonths: { type: Number, default: 6 },   // GTU = 6 months per sem
  totalSemesters:         { type: Number, default: 8 },   // GTU = 8 sems (4 years)
  currentAcademicYear:    { type: String },                // e.g. '2024-25'
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);
