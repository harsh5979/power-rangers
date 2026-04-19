const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester:   { type: Number, required: true },
  college:    { type: String, required: true },
  faculty:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // assigned faculty
}, { timestamps: true });

subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ college: 1, department: 1, semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
