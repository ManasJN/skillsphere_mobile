const mongoose = require('mongoose');

const studentVerificationRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  idProofUrl: { type: String, required: true },
  admissionProofUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  submittedProfile: {
    department: String,
    semester: Number,
    rollNumber: String,
    batch: String,
    phone: String,
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  decisionNote: { type: String, default: '' },
}, { timestamps: true });

studentVerificationRequestSchema.index({ student: 1, status: 1 });
studentVerificationRequestSchema.index({ college: 1, status: 1 });

module.exports = mongoose.model('StudentVerificationRequest', studentVerificationRequestSchema);
