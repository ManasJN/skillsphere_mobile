const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  name:     { type: String, required: true, trim: true, maxlength: 80 },
  category: {
    type: String,
    enum: ['DSA', 'Web Development', 'AI/ML', 'Cloud', 'UI/UX', 'App Development',
           'DevOps', 'Cybersecurity', 'Database', 'Language', 'Framework', 'Other'],
    default: 'Other',
  },

  // 0-100 self-assessed level
  level:      { type: Number, min: 0, max: 100, default: 0 },
  targetLevel: { type: Number, min: 0, max: 100, default: 100 },

  // Resources / proof
  resources:  [{ title: String, url: String }],
  certUrl:    { type: String, default: '' }, // certificate link

  // Timeline
  startedAt:   { type: Date },
  targetDate:  { type: Date },
  completedAt: { type: Date },

  isPublic: { type: Boolean, default: true },

  // Tags for search
  tags: [{ type: String, lowercase: true, trim: true }],

  // XP awarded when skill reaches 100
  xpReward: { type: Number, default: 200 },

}, { timestamps: true });

skillSchema.index({ user: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ name: 'text', tags: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
