const mongoose = require('mongoose');

const careerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  interests: [{ type: String, trim: true }],
  preferredDomain: {
    type: String,
    enum: [
      'Web Development', 'Mobile Development', 'AI/ML', 'Data Science',
      'Cloud & DevOps', 'Cybersecurity', 'DSA & Competitive Programming',
      'UI/UX Design', 'Embedded/IoT', 'Not sure yet',
    ],
    default: 'Not sure yet',
  },
  learningGoals: [{ type: String, trim: true }],
  weakAreas: [{ type: String, trim: true }],
  academicFocus: { type: String, trim: true, maxlength: 500 },
  additionalNotes: { type: String, trim: true, maxlength: 1000 },

  lastSubmittedAt: { type: Date },
}, { timestamps: true });

careerProfileSchema.index({ user: 1 });

module.exports = mongoose.model('CareerProfile', careerProfileSchema);
