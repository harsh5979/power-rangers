const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  college:        { type: String, required: true },
  durationYears:  { type: Number, required: true },          // e.g. 4
  totalSemesters: { type: Number },                           // auto: durationYears * 2
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-compute totalSemesters before save
departmentSchema.pre('save', function (next) {
  this.totalSemesters = this.durationYears * 2;
  next();
});

departmentSchema.index({ college: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
