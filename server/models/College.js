const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  collegeName: { type: String, required: true, trim: true, maxlength: 180 },
  officialEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email'],
  },
  website: { type: String, default: '', trim: true },
  logo: { type: String, default: '' },
  documents: [{ type: String }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  authorizedRepresentative: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    designation: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

collegeSchema.index({ collegeName: 'text', officialEmail: 'text' });
collegeSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('College', collegeSchema);
