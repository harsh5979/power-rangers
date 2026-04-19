const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role: { type: String, enum: ['admin', 'college_admin', 'principal', 'faculty', 'mentor', 'subject_coordinator', 'student'], required: true },
  college:    { type: String },
  department: { type: String },
  subjects:   [{ type: String }],       // subjects this faculty teaches
  division:   { type: String },         // division this mentor is assigned to (e.g. 'A')
  branch:     { type: String },         // branch (CE, IT etc.)
  batch:      { type: Number },         // enrollment year mentor is assigned to (e.g. 2022)
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  studentProfile:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  isVerified:  { type: Boolean, default: true },
  isApproved:  { type: Boolean, default: true },
  resetPasswordToken:   String,
  resetPasswordExpires: Date,
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.index({ role: 1, college: 1 });
userSchema.index({ college: 1, division: 1 });

module.exports = mongoose.model('User', userSchema);
