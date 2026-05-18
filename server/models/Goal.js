const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { _id: true });

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 1000, default: '' },

  type: {
    type: String,
    enum: ['monthly', 'semester', 'yearly', 'custom'],
    default: 'semester',
  },
  category: {
    type: String,
    enum: ['Coding', 'Academic', 'Project', 'Skill', 'Career', 'Health', 'Other'],
    default: 'Other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned'],
    default: 'active',
  },

  // Progress: 0-100
  progress:    { type: Number, min: 0, max: 100, default: 0 },
  targetValue: { type: Number }, // e.g. 300 (problems), 9.0 (cgpa)
  currentValue:{ type: Number, default: 0 },
  unit:        { type: String }, // "problems", "commits", "projects"

  // Timeline
  deadline:    { type: Date, required: true },
  completedAt: { type: Date },

  // Sub-tasks
  milestones: [milestoneSchema],

  // XP reward on completion
  xpReward: { type: Number, default: 300 },

  isPublic: { type: Boolean, default: false },

}, { timestamps: true });

goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ deadline: 1 });

// Auto-update progress from currentValue/targetValue
goalSchema.pre('save', function (next) {
  if (this.targetValue && this.targetValue > 0) {
    this.progress = Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
  }
  if (this.progress === 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Goal', goalSchema);
