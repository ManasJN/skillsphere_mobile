const mongoose = require('mongoose');

const itemWithWhy = {
  title: { type: String, required: true },
  description: { type: String, default: '' },
  why: { type: String, default: '' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  url: { type: String, default: '' },
};

const recommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  profileSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  summary: { type: String, default: '' },

  courses: [{
    title: String,
    provider: String,
    why: String,
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    url: String,
    estimatedWeeks: Number,
  }],

  skillsToImprove: [{
    name: String,
    currentGap: String,
    why: String,
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    targetLevel: Number,
  }],

  careerPaths: [{
    title: String,
    description: String,
    why: String,
    fitLabel: { type: String, default: 'Good match' },
  }],

  weaknessAnalysis: [{
    area: String,
    detail: String,
    severity: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  }],

  roadmap: [{
    phase: String,
    title: String,
    timeframe: String,
    tasks: [String],
  }],

  technologies: [{
    name: String,
    why: String,
    order: Number,
  }],

  priorityAreas: [{
    area: String,
    reason: String,
    urgency: { type: String, enum: ['now', 'soon', 'later'], default: 'soon' },
  }],

  progressInsights: [{
    metric: String,
    insight: String,
    trend: { type: String, enum: ['up', 'flat', 'needs-work'], default: 'flat' },
  }],

  tips: [{ type: String }],
  futureOpportunities: [{
    title: String,
    description: String,
    why: String,
  }],

  engineVersion: { type: String, default: 'rule-v1' },
}, { timestamps: true });

recommendationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
