const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title:       { type: String, required: true, trim: true, maxlength: 200 },
  company:     { type: String, required: true, trim: true },
  description: { type: String, maxlength: 5000, default: '' },
  logoUrl:     { type: String, default: '' },

  type: {
    type: String,
    enum: ['Internship', 'Hackathon', 'Research', 'Competition', 'Workshop', 'Scholarship', 'Job'],
    required: true,
  },

  // Who can apply
  eligibleDepts: [{ type: String, enum: ['CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL', 'ALL'] }],
  minCGPA:       { type: Number, default: 0 },
  minSemester:   { type: Number, default: 1 },
  maxSemester:   { type: Number, default: 8 },

  // Required skills (for matching)
  requiredSkills: [{ type: String, trim: true }],
  preferredSkills:[{ type: String, trim: true }],

  // Aspirations this suits
  suitableFor: [{
    type: String,
    enum: ['Placements', 'GATE', 'Higher Studies', 'Startup', 'Research', 'Government', 'Freelancing'],
  }],

  // Links & details
  applyUrl:    { type: String, default: '' },
  stipend:     { type: String, default: '' }, // "₹15,000/month" or "Unpaid"
  location:    { type: String, default: 'Remote' },
  duration:    { type: String, default: '' }, // "2 months"

  deadline:    { type: Date, required: true },
  isActive:    { type: Boolean, default: true },

  // Applicants
  applications:[{
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt:   { type: Date, default: Date.now },
    status:      { type: String, enum: ['pending', 'shortlisted', 'rejected', 'selected'], default: 'pending' },
  }],

  views: { type: Number, default: 0 },
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

opportunitySchema.index({ type: 1, isActive: 1 });
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ requiredSkills: 1 });
opportunitySchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
