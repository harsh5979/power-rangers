const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // faculty mentor
  message: { type: String, required: true },
  riskLevel: { type: String, enum: ['medium', 'high'], required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
