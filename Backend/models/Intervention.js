const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['counselling', 'remedial_class', 'assignment_extension', 'parent_meeting', 'other'],
    required: true,
  },
  remarks: { type: String, required: true },
  date: { type: Date, default: Date.now },
  // snapshot for pre/post comparison
  preRiskScore: { type: Number },
  postRiskScore: { type: Number },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Intervention', interventionSchema);
