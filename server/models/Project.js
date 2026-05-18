const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Team projects (optional)
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  title:       { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, maxlength: 2000, default: '' },
  thumbnail:   { type: String, default: '' }, // URL

  techStack:   [{ type: String, trim: true }],
  domain: {
    type: String,
    enum: ['Web', 'Mobile', 'AI/ML', 'IoT', 'Game', 'CLI', 'API', 'Research', 'Other'],
    default: 'Other',
  },

  status: {
    type: String,
    enum: ['planned', 'ongoing', 'completed', 'abandoned'],
    default: 'planned',
  },

  // Links
  githubUrl:   { type: String, default: '' },
  liveUrl:     { type: String, default: '' },
  videoUrl:    { type: String, default: '' },
  screenshots: [{ type: String }], // array of URLs

  // Timeline
  startDate:   { type: Date },
  endDate:     { type: Date },

  // Achievements / awards
  awards: [{ title: String, event: String, position: String }],

  // Visibility
  isPublic:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },

  // Engagement
  views:       { type: Number, default: 0 },
  likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // XP for completing
  xpReward:    { type: Number, default: 500 },

}, { timestamps: true });

projectSchema.index({ user: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ techStack: 1 });
projectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
